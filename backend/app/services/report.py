"""Screen 6: turn a scan's answers into the shareable report.

Everything is a yes/no check or a count of checks: no percentages, no scores. A cell (question × engine) is the
majority vote over its samples; the headline counts cells on unbranded questions, where AI chooses what to
recommend on its own."""

import json
import re
from collections import Counter, defaultdict

from sqlmodel import Session, select

from app import llm
from app.config import settings
from app.db import engine
from app.engines.registry import COMING_SOON, ENGINES
from app.models import Answer, Company, Competitor, Product, Prompt, Report, Scan
from app.schemas import FixPlan
from app.services.checks import _domain, aggregate_cell, owned_domains

FIX_SYSTEM = (
    "You are a pharma search and AI-visibility strategist. From the scan findings, propose the 3 highest-impact "
    "fixes the brand team can make. Accuracy corrections come first when AI states things that contradict the label. "
    "Then the unbranded questions where AI recommends competitors instead, and the sources AI cites for them. Every "
    "fix must be doable with on-label, compliant content (no off-label promotion, no paid endorsements). "
    "Keys are short lowercase slugs. target_prompts copies question texts verbatim from the findings (up to 3)."
)

STATES = ("you", "competitor", "none", "not_shown", "error")
LABELS = {e.name: e.label for e in ENGINES}


def _tally(cells: list[dict]) -> dict:
    counts = Counter(c["state"] for c in cells)
    return {"asked": len(cells), **{s: counts.get(s, 0) for s in STATES}}


def build_payload(product: Product, company: Company, prompts: list[Prompt], competitors: list[str],
                  answers: list[Answer], engine_names: list[str], previous: dict | None = None) -> dict:
    by_cell: dict[tuple[int, str], list[Answer]] = defaultdict(list)
    for a in answers:
        by_cell[(a.prompt_id, a.engine)].append(a)
    cells = {key: aggregate_cell(v) for key, v in by_cell.items()}
    engines = [e for e in engine_names if any(k[1] == e for k in cells)] or engine_names

    questions = [{
        "id": p.id, "text": p.text, "audience": p.audience, "kind": p.lane, "source": p.source,
        "cells": {e: cells.get((p.id, e), {"state": "error", "error": "not asked"}) for e in engines},
    } for p in prompts]
    unbranded = [q for q in questions if q["kind"] == "unbranded"]

    summary = {}
    for e in engines:
        ub = [q["cells"][e] for q in unbranded]
        rivals = Counter(c for cell in ub for c in cell.get("competitors_mentioned", []))
        top = rivals.most_common(1)
        summary[e] = {
            "label": LABELS.get(e, e),
            "unbranded": _tally(ub),
            "all": _tally([q["cells"][e] for q in questions]),
            "top_competitor": {"brand": top[0][0], "count": top[0][1]} if top else None,
            "label_conflicts": sum(bool(q["cells"][e].get("label_conflict")) for q in questions),
        }

    competitor_rows = []
    for brand in competitors:
        by_engine = {e: sum(brand in q["cells"][e].get("competitors_mentioned", []) for q in unbranded) for e in engines}
        competitor_rows.append({"brand": brand, "by_engine": by_engine, "total": sum(by_engine.values())})
    competitor_rows.sort(key=lambda r: -r["total"])

    prompt_by_id = {p.id: p for p in prompts}
    accuracy = [
        {**issue, "engine": a.engine, "sample": a.sample, "prompt_id": a.prompt_id, "prompt": prompt_by_id[a.prompt_id].text}
        for a in answers if not a.error for issue in a.accuracy_issues
    ]
    accuracy.sort(key=lambda i: {"high": 0, "medium": 1, "low": 2}.get(i.get("severity"), 3))

    lost = []
    for q in unbranded:
        losing = [e for e in engines if q["cells"][e]["state"] == "competitor"]
        if losing:
            rivals = sorted({c for e in losing for c in q["cells"][e].get("competitors_mentioned", [])})
            lost.append({"prompt_id": q["id"], "prompt": q["text"], "audience": q["audience"], "engines": losing,
                         "competitors": rivals})
    lost.sort(key=lambda l: -len(l["engines"]))

    return {
        "product": {"id": product.id, "brand": product.brand, "molecule": product.molecule,
                    "indication": product.indication, "tier": product.tier},
        "company": {"name": company.name, "domain": company.domain},
        "engines": [{"name": e, "label": LABELS.get(e, e),
                     "samples": max((len(v) for k, v in by_cell.items() if k[1] == e), default=1)} for e in engines],
        "coming_soon": [{"name": n, "label": label} for n, label in COMING_SOON],
        "questions": questions,
        "summary": summary,
        "competitors": competitor_rows,
        "accuracy_issues": accuracy,
        "lost_questions": lost,
        "sources": sources(answers, owned_domains(company, product), prompt_by_id),
        "changes": changes(questions, previous) if previous else None,
        "methodology": (
            f"{len(questions)} questions ({len(unbranded)} unbranded) on {len(engines)} engines. Claude answers each "
            f"question {settings.claude_samples} times with web search on; a check is ticked when most answers agree. "
            "Google AI Overviews and AI Mode are fetched once per question (US, desktop). Every answer that names the "
            "drug is checked against its FDA label."),
    }


def sources(answers: list[Answer], owned: list[str], prompt_by_id: dict) -> dict:
    """Domains AI cites, split by whose answers they back: only competitors', yours, and per competitor."""
    stats: dict[str, dict] = defaultdict(lambda: {"citations": 0, "engines": set(), "you": 0, "rivals": Counter(),
                                                  "questions": set()})
    for a in answers:
        if a.error or not a.shown:
            continue
        for d in {_domain(c.get("url", "")) for c in a.citations}:
            if not d or any(stem in d for stem in owned):
                continue
            s = stats[d]
            s["citations"] += 1
            s["engines"].add(a.engine)
            s["you"] += a.mentioned
            s["rivals"].update(a.competitors_mentioned)
            s["questions"].add(prompt_by_id[a.prompt_id].text if a.prompt_id in prompt_by_id else "")

    def row(d: str, s: dict) -> dict:
        return {"domain": d, "citations": s["citations"], "engines": sorted(s["engines"]),
                "competitors": [c for c, _ in s["rivals"].most_common()], "cites_you": s["you"] > 0,
                "questions": sorted(q for q in s["questions"] if q)[:3]}

    ranked = sorted(stats.items(), key=lambda kv: -kv[1]["citations"])
    by_competitor: dict[str, list] = defaultdict(list)
    for d, s in ranked:
        for c in s["rivals"]:
            if len(by_competitor[c]) < 5:
                by_competitor[c].append({"domain": d, "citations": s["rivals"][c]})
    return {
        "competitor_only": [row(d, s) for d, s in ranked if s["rivals"] and not s["you"]][:8],
        "yours": [row(d, s) for d, s in ranked if s["you"]][:8],
        "by_competitor": dict(by_competitor),
    }


def changes(questions: list[dict], previous: dict) -> list[dict]:
    """Cells whose state changed since the previous scan of the same drug (matched by question text)."""
    before = {(q["text"], e): cell["state"] for q in previous.get("questions", []) for e, cell in q["cells"].items()}
    out = []
    for q in questions:
        for e, cell in q["cells"].items():
            old = before.get((q["text"], e))
            if old and old != cell["state"] and "error" not in (old, cell["state"]):
                out.append({"prompt_id": q["id"], "prompt": q["text"], "engine": e, "before": old, "after": cell["state"]})
    return out


def fallback_fixes(payload: dict) -> list[dict]:
    fixes = []
    if payload["accuracy_issues"]:
        i = payload["accuracy_issues"][0]
        fixes.append({"key": "correct-" + i["type"].replace("_", "-"), "title": f"Correct the {i['type'].replace('_', ' ')} AI states",
                      "why": i["explanation"], "kind": "accuracy_correction", "target_prompts": [i["prompt"]]})
    for lp in payload["lost_questions"]:
        fixes.append({"key": f"win-{lp['prompt_id']}", "title": f"Answer: “{lp['prompt']}”",
                      "why": f"{', '.join(lp['competitors'])} are recommended here and you are not.",
                      "kind": "on_page_content", "target_prompts": [lp["prompt"]]})
    return fixes[:3]


def _previous_payload(session: Session, scan: Scan) -> dict | None:
    prev = session.exec(select(Scan).where(Scan.product_id == scan.product_id, Scan.id < scan.id, Scan.status == "done",
                                           Scan.report_id != None).order_by(Scan.id.desc())).first()  # noqa: E711
    if not prev:
        return None
    report = session.get(Report, prev.report_id)
    return report.payload if report and "questions" in report.payload else None


async def build_report(scan_id: int) -> str:
    with Session(engine) as s:
        scan = s.get(Scan, scan_id)
        product = s.get(Product, scan.product_id)
        company = s.get(Company, product.company_id)
        prompts = list(s.exec(select(Prompt).where(Prompt.product_id == product.id).order_by(Prompt.id)))
        competitors = [c.brand for c in s.exec(select(Competitor).where(Competitor.product_id == product.id))]
        answers = list(s.exec(select(Answer).where(Answer.scan_id == scan_id)))
        payload = build_payload(product, company, prompts, competitors, answers, scan.engines,
                                previous=_previous_payload(s, scan))
        payload["scan"] = {"id": scan.id, "kind": scan.kind}
        s.expunge_all()

    findings = {k: payload[k] for k in ("summary", "lost_questions")}
    findings["accuracy_issues"] = payload["accuracy_issues"][:12]
    findings["sources_only_competitors_are_cited_in"] = payload["sources"]["competitor_only"]
    try:
        plan = await llm.smart(FIX_SYSTEM, f"Brand: {product.brand}\n\n{json.dumps(findings)[:30000]}", FixPlan)
        payload["fixes"] = [f.model_dump() for f in plan.fixes[:3]]
        for i, f in enumerate(payload["fixes"]):  # keys are used in URLs
            f["key"] = re.sub(r"[^a-z0-9]+", "-", f["key"].lower()).strip("-") or f"fix-{i + 1}"
    except Exception:
        payload["fixes"] = fallback_fixes(payload)

    with Session(engine) as s:
        report = Report(scan_id=scan_id, payload=payload)
        s.add(report)
        s.commit()
        return report.id
