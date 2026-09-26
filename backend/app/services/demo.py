"""Demo mode: record one real live run, replay it instantly and offline through the same jobs and events.

The bundle holds the run's database rows and each job's real event log (the agents' actual steps, the scan's
cells, the fix loop's rounds). Replays insert the rows under the new ids and re-emit the events, faster.
Record with:  python -m app.scripts.record_demo --company <id>"""

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path

from sqlmodel import Session, select

from app.db import engine
from app.jobs import JobContext
from app.models import (Answer, Company, Competitor, CompetitorAd, Draft, Job, JobEvent, Opportunity, Product, Prompt,
                        Report, Scan)

BUNDLE = Path(__file__).resolve().parents[2] / "fixtures" / "demo" / "bundle.json"
STEP_DELAY, CELL_DELAY = 0.35, 0.06  # seconds between replayed events; makes the replay feel live
_EXCLUDE = {"id", "company_id", "product_id", "scan_id", "prompt_id", "report_id", "org_id"}


def available() -> bool:
    return BUNDLE.exists() and load().get("version") == 2


_cache: dict = {}


def load() -> dict:
    if "bundle" not in _cache:
        _cache["bundle"] = json.loads(BUNDLE.read_text(encoding="utf-8"))
    return _cache["bundle"]


def _row(obj) -> dict:
    return {k: v for k, v in obj.model_dump(mode="json").items() if k not in _EXCLUDE}


_TIMESTAMPS = {"created_at", "fetched_at", "updated_at"}


def _fresh(row: dict) -> dict:
    """A recorded row minus its timestamps (JSON strings in the bundle); they default to now on replay."""
    return {k: v for k, v in row.items() if k not in _TIMESTAMPS}


def _events(s: Session, job_id: str) -> list[dict]:
    return [{"event": e.event, "data": e.data} for e in
            s.exec(select(JobEvent).where(JobEvent.job_id == job_id).order_by(JobEvent.id))]


def record(company_id: int) -> Path:
    """Dump a finished live run (company → hero → latest scan → report → drafts → opportunities)."""
    with Session(engine) as s:
        company = s.get(Company, company_id)
        products = s.exec(select(Product).where(Product.company_id == company_id)).all()
        hero = next(p for p in products if p.is_hero)
        scan = s.exec(select(Scan).where(Scan.product_id == hero.id, Scan.status == "done").order_by(Scan.id.desc())).first()
        report = s.get(Report, scan.report_id)
        prompts = s.exec(select(Prompt).where(Prompt.product_id == hero.id)).all()
        text_of = {p.id: p.text for p in prompts}
        drafts = s.exec(select(Draft).where(Draft.report_id == report.id)).all()
        discovery_job = next(j for j in s.exec(select(Job).where(Job.kind == "discovery"))
                             if j.params.get("company_id") == company_id)
        bundle = {
            "version": 2,
            "recorded_at": datetime.now(timezone.utc).isoformat(),
            "company": _row(company),
            "products": [_row(p) for p in products],
            "competitors": [_row(c) for c in s.exec(select(Competitor).where(Competitor.product_id == hero.id))],
            "prompts": [_row(p) for p in prompts],
            "answers": [{**_row(a), "prompt_text": text_of[a.prompt_id]}
                        for a in s.exec(select(Answer).where(Answer.scan_id == scan.id))],
            "engines": scan.engines,
            "fixes": report.payload.get("fixes", []),
            "drafts": [_row(d) for d in drafts],
            "opportunities": [_row(o) for o in s.exec(select(Opportunity).where(Opportunity.product_id == hero.id))],
            "ads": [_row(a) for a in s.exec(select(CompetitorAd).where(CompetitorAd.product_id == hero.id))],
            "events": {
                "discovery": _events(s, discovery_job.id),
                "setup": _events(s, f"setup-{hero.id}"),
                "scan": _events(s, f"scan-{scan.id}"),
                "promo": _events(s, f"promo-{hero.id}"),
                "fixes": {d.fix_key: _events(s, f"fix-{report.id}-{d.fix_key}") for d in drafts},
            },
        }
        # the replayed scan's events refer to prompts by id; keep the text so replays can remap them
        bundle["events"]["scan_prompts"] = text_of
    BUNDLE.parent.mkdir(parents=True, exist_ok=True)
    BUNDLE.write_text(json.dumps(bundle, indent=1, default=str), encoding="utf-8")
    _cache.clear()
    return BUNDLE


async def _replay(job: JobContext, events: list[dict], *, skip_terminal: bool = True, remap=None) -> None:
    for e in events:
        if skip_terminal and e["event"] in ("done", "error"):
            continue
        data = remap(e) if remap else e["data"]
        if data is None:
            continue
        job.emit(e["event"], data)
        await asyncio.sleep(CELL_DELAY if e["event"] in ("answer", "counters") else STEP_DELAY)


def _hero_brand(b: dict) -> str:
    return next(p["brand"] for p in b["products"] if p["is_hero"])


async def replay_discovery(job: JobContext, company_id: int) -> None:
    b = load()
    await _replay(job, b["events"]["discovery"])
    with Session(engine) as s:
        company = s.get(Company, company_id)
        for k, v in b["company"].items():
            if k not in ("domain",):
                setattr(company, k, v)
        company.status = "ready"
        s.add(company)
        for p in b["products"]:
            s.add(Product(company_id=company_id, **p))
        s.commit()
    job.finish("done", {"company_id": company_id})


async def replay_setup(job: JobContext, product_id: int) -> bool:
    """Only the recorded hero drug has recorded competitors and questions; others go live."""
    b = load()
    with Session(engine) as s:
        product = s.get(Product, product_id)
        if product.brand.lower() != _hero_brand(b).lower():
            return False
    await _replay(job, b["events"]["setup"])
    with Session(engine) as s:
        s.add_all(Competitor(product_id=product_id, **c) for c in b["competitors"])
        s.add_all(Prompt(product_id=product_id, **p) for p in b["prompts"])
        s.commit()
    job.finish("done", {"product_id": product_id})
    return True


async def replay_scan(job: JobContext, scan_id: int) -> None:
    from app.services.report import build_payload

    b = load()
    with Session(engine) as s:
        scan = s.get(Scan, scan_id)
        product = s.get(Product, scan.product_id)
        company = s.get(Company, product.company_id)
        prompts = list(s.exec(select(Prompt).where(Prompt.product_id == product.id).order_by(Prompt.id)))
        competitors = [c.brand for c in s.exec(select(Competitor).where(Competitor.product_id == product.id))]
        id_of = {p.text: p.id for p in prompts}
        s.expunge_all()
    old_text = {int(k): v for k, v in b["events"].get("scan_prompts", {}).items()}

    def remap(e: dict) -> dict | None:
        if e["event"] != "answer":
            return e["data"]
        new_id = id_of.get(old_text.get(e["data"]["prompt_id"], ""))
        return {**e["data"], "prompt_id": new_id} if new_id else None

    await _replay(job, b["events"]["scan"], remap=remap)
    saved = []
    with Session(engine) as s:
        for a in b["answers"]:
            if a["prompt_text"] in id_of:
                row = Answer(scan_id=scan_id, prompt_id=id_of[a["prompt_text"]],
                             **{k: v for k, v in a.items() if k != "prompt_text"})
                s.add(row)
                saved.append(row)
        s.commit()
        for row in saved:
            s.refresh(row)
        s.expunge_all()
        payload = build_payload(product, company, prompts, competitors, saved, b["engines"])
        payload["fixes"], payload["scan"] = b["fixes"], {"id": scan_id, "kind": scan.kind}
        report = Report(scan_id=scan_id, payload=payload)
        s.add(report)
        scan = s.get(Scan, scan_id)
        scan.status, scan.report_id = "done", report.id
        scan.stats = next((e["data"] for e in reversed(b["events"]["scan"]) if e["event"] == "counters"), {})
        scan.finished_at = datetime.now(timezone.utc)
        s.add(scan)
        s.commit()
        report_id = report.id
    job.finish("done", {"report_id": report_id})


async def replay_fix(job: JobContext, report_id: str, fix_key: str) -> bool:
    b = load()
    recorded = next((d for d in b["drafts"] if d["fix_key"] == fix_key), None)
    if not recorded:
        return False
    await _replay(job, b["events"]["fixes"].get(fix_key, []))
    with Session(engine) as s:
        report = s.get(Report, report_id)
        draft = Draft(report_id=report_id, product_id=report.payload["product"]["id"], **_fresh(recorded))
        s.add(draft)
        s.commit()
        draft_id = draft.id
    job.finish("done", {"draft_id": draft_id})
    return True


async def replay_promo(job: JobContext, product_id: int) -> bool:
    b = load()
    with Session(engine) as s:
        if s.get(Product, product_id).brand.lower() != _hero_brand(b).lower() or not b["opportunities"]:
            return False
    await _replay(job, b["events"]["promo"])
    with Session(engine) as s:
        s.add_all(CompetitorAd(product_id=product_id, **_fresh(a)) for a in b["ads"])
        s.add_all(Opportunity(product_id=product_id, **_fresh(o)) for o in b["opportunities"])
        s.commit()
    job.finish("done", {"product_id": product_id})
    return True
