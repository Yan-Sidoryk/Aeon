"""Demo fallback: record one real onboarding to a JSON bundle, replay it instantly and offline.

Replays go through the same DB tables and SSE events as the live path, so the frontend
can't tell the difference (apart from speed)."""

import asyncio
import json
from pathlib import Path

from sqlmodel import Session, select

from app.db import engine
from app.events import Job
from app.models import Answer, Company, Competitor, Draft, Product, Prompt, Report, Scan
from app.services.report import aggregate

BUNDLE = Path(__file__).resolve().parents[2] / "fixtures" / "demo" / "bundle.json"
STEP_DELAY, CELL_DELAY = 0.8, 0.12  # seconds; makes the replay feel live
_EXCLUDE = {"id", "company_id", "product_id", "scan_id", "prompt_id", "report_id"}


def available() -> bool:
    return BUNDLE.exists()


def load() -> dict:
    return json.loads(BUNDLE.read_text(encoding="utf-8"))


def _row(obj) -> dict:
    return {k: v for k, v in obj.model_dump(mode="json").items() if k not in _EXCLUDE}


def record(company_id: int) -> Path:
    """Dump a finished live run (company → hero product → latest scan → report → drafts)."""
    with Session(engine) as s:
        company = s.get(Company, company_id)
        products = s.exec(select(Product).where(Product.company_id == company_id)).all()
        hero = next(p for p in products if p.is_hero)
        scan = s.exec(select(Scan).where(Scan.product_id == hero.id, Scan.status == "done")
                      .order_by(Scan.id.desc())).first()
        prompts = s.exec(select(Prompt).where(Prompt.product_id == hero.id)).all()
        text_of = {p.id: p.text for p in prompts}
        report = s.get(Report, scan.report_id)
        bundle = {
            "company": _row(company),
            "products": [_row(p) for p in products],
            "competitors": [_row(c) for c in s.exec(select(Competitor).where(Competitor.product_id == hero.id))],
            "prompts": [_row(p) for p in prompts],
            "answers": [{**_row(a), "prompt_text": text_of[a.prompt_id]}
                        for a in s.exec(select(Answer).where(Answer.scan_id == scan.id))],
            "fixes": report.payload.get("fixes", []),
            "drafts": [_row(d) for d in s.exec(select(Draft).where(Draft.report_id == report.id))],
        }
    BUNDLE.parent.mkdir(parents=True, exist_ok=True)
    BUNDLE.write_text(json.dumps(bundle, indent=1), encoding="utf-8")
    return BUNDLE


STEPS = [("read", "Reading your website…", "Read 17 pages"), ("extract", "Finding your products…", "Found {n} products"),
         ("labels", "Pulling FDA labels…", "Pulled {n} FDA labels"), ("map", "Mapping indications…", "Mapped indications")]


async def replay_discovery(job: Job, company_id: int) -> None:
    b = load()
    with Session(engine) as s:
        company = s.get(Company, company_id)
        for k, v in b["company"].items():
            if k not in ("org_id", "domain"):
                setattr(company, k, v)
        company.status = "ready"
        s.add(company)
        for p in b["products"]:
            s.add(Product(company_id=company_id, **p))
        s.commit()
    n = sum(not p["pipeline"] for p in b["products"])
    for key, active, done in STEPS:
        job.emit("step", {"key": key, "label": active, "status": "active"})
        await asyncio.sleep(STEP_DELAY)
        job.emit("step", {"key": key, "label": done.format(n=n), "status": "done"})
    job.finish("done", {"company_id": company_id})


def seed_setup(session: Session, product: Product) -> bool:
    """Copy the recorded competitors + prompts onto the hero product. False if the bundle doesn't cover it."""
    b = load()
    if product.brand.lower() != next(p["brand"] for p in b["products"] if p["is_hero"]).lower():
        return False
    session.add_all(Competitor(product_id=product.id, **c) for c in b["competitors"])
    session.add_all(Prompt(product_id=product.id, **p) for p in b["prompts"])
    session.commit()
    return True


async def replay_scan(job: Job, scan_id: int) -> None:
    b = load()
    with Session(engine) as s:
        scan = s.get(Scan, scan_id)
        product = s.get(Product, scan.product_id)
        prompts = list(s.exec(select(Prompt).where(Prompt.product_id == product.id)))
        competitors = [c.brand for c in s.exec(select(Competitor).where(Competitor.product_id == product.id))]
        id_of = {p.text: p.id for p in prompts}
        s.expunge_all()

    answers = [a for a in b["answers"] if a["prompt_text"] in id_of]
    counters = {"answers": 0, "total": len(answers), "mentions": 0, "competitor_mentions": 0,
                "accuracy_issues": 0, "errors": 0}
    saved: list[Answer] = []
    for a in answers:
        await asyncio.sleep(CELL_DELAY)
        row = Answer(scan_id=scan_id, prompt_id=id_of[a["prompt_text"]],
                     **{k: v for k, v in a.items() if k != "prompt_text"})
        with Session(engine) as s:
            s.add(row)
            s.commit()
            s.refresh(row)
            s.expunge(row)
        saved.append(row)
        counters["answers"] += 1
        counters["errors"] += bool(row.error)
        counters["mentions"] += row.mentioned
        counters["competitor_mentions"] += bool(row.competitors_mentioned)
        counters["accuracy_issues"] += len(row.accuracy_issues)
        job.emit("answer", {"prompt_id": row.prompt_id, "engine": row.engine, "mentioned": row.mentioned,
                            "position": row.position, "competitors_mentioned": row.competitors_mentioned,
                            "accuracy_issues": len(row.accuracy_issues), "error": row.error})
        job.emit("counters", dict(counters))

    with Session(engine) as s:
        product = s.get(Product, product.id)
        company = s.get(Company, product.company_id)
        payload = aggregate(product, prompts, competitors, saved, owned_domains=(company.domain.split(".")[0],))
        payload["company"] = {"name": company.name, "domain": company.domain}
        payload["fixes"] = b["fixes"]
        report = Report(scan_id=scan_id, payload=payload)
        s.add(report)
        scan = s.get(Scan, scan_id)
        scan.status, scan.stats, scan.report_id = "done", counters, report.id
        s.add(scan)
        s.commit()
        job.finish("done", {"report_id": report.id})


def recorded_draft(session: Session, report: Report, fix_key: str) -> Draft | None:
    d = next((d for d in load()["drafts"] if d["fix_key"] == fix_key), None)
    if not d:
        return None
    draft = Draft(report_id=report.id, **d)
    session.add(draft)
    session.commit()
    session.refresh(draft)
    return draft
