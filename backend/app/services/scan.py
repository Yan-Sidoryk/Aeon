"""Screen 5: fan prompts out to every enabled engine, parse each answer, check accuracy
against the label, and stream each finished cell to the grid."""

import asyncio
import json
from datetime import datetime, timezone

from sqlmodel import Session, select

from app import llm
from app.config import settings
from app.db import engine
from app.engines.base import Engine
from app.events import Job
from app.models import Answer, Competitor, Product, Prompt, Scan
from app.schemas import AccuracyCheck, AnswerParse
from app.services.report import build_report

PARSE_SYSTEM = (
    "You analyse an AI assistant's answer. Say whether it mentions our brand (by brand or molecule name), the "
    "rank at which our brand appears among treatments named (1 = first, null if not mentioned), which of the "
    "listed competitors it mentions (by brand or molecule; return the brand name exactly as listed), and the "
    "sentiment toward our brand."
)

ACCURACY_SYSTEM = (
    "You are a medical information reviewer. Compare what the AI answer says about OUR drug with the FDA label. "
    "Report only statements about our drug that contradict or materially misstate the label: wrong dose or "
    "schedule, wrong or unapproved indication or population, a missing or wrong boxed warning when safety is "
    "discussed, wrong contraindications. Quote the AI sentence and the closest label sentence verbatim. "
    "Statements about other drugs, or omissions that are not misleading, are not issues. Return an empty list "
    "when the answer is accurate."
)


def match_competitors(names: list[str], comp_rows: list[Competitor]) -> list[str]:
    """Map whatever the parser returned ("Eucrisa (crisaborole)", "dupilumab") to our competitor brands."""
    found = []
    for c in comp_rows:
        keys = [k for k in (c.brand.lower(), c.molecule.lower()) if k]
        if any(k in n.lower() or n.lower() in k for n in names for k in keys if n):
            found.append(c.brand)
    return found


def _label_text(label: dict) -> str:
    return "\n\n".join(f"[{k}]\n{v}" for k, v in label.items() if v)


async def run_scan(job: Job, scan_id: int, engines: list[Engine]) -> None:
    try:
        await _scan(job, scan_id, engines)
    except Exception as exc:
        with Session(engine) as s:
            scan = s.get(Scan, scan_id)
            scan.status = "failed"
            s.add(scan)
            s.commit()
        job.finish("error", {"message": str(exc)})


async def _scan(job: Job, scan_id: int, engines: list[Engine]) -> None:
    with Session(engine) as s:
        scan = s.get(Scan, scan_id)
        product = s.get(Product, scan.product_id)
        prompts = s.exec(select(Prompt).where(Prompt.product_id == product.id)).all()
        comp_rows = s.exec(select(Competitor).where(Competitor.product_id == product.id)).all()
        comp_list = [f"{c.brand} ({c.molecule})" if c.molecule else c.brand for c in comp_rows]
        s.expunge_all()

    counters = {"answers": 0, "total": len(prompts) * len(engines), "mentions": 0,
                "competitor_mentions": 0, "accuracy_issues": 0, "errors": 0}
    sem = asyncio.Semaphore(settings.scan_concurrency)
    lock = asyncio.Lock()
    label_text = _label_text(product.label)
    ours = f"Our brand: {product.brand} (molecule: {product.molecule})\nCompetitors: {json.dumps(comp_list)}"

    async def cell(prompt: Prompt, eng: Engine) -> None:
        async with sem:
            ans = Answer(scan_id=scan_id, prompt_id=prompt.id, engine=eng.name)
            try:
                res = await eng.ask(prompt.text)
                ans.text, ans.citations = res.text, res.citations
                parsed = await llm.fast(PARSE_SYSTEM, f"{ours}\n\nQuestion: {prompt.text}\n\nAnswer:\n{res.text}", AnswerParse)
                ans.mentioned, ans.position = parsed.mentioned, parsed.position
                ans.sentiment = parsed.sentiment
                ans.competitors_mentioned = match_competitors(parsed.competitors_mentioned, comp_rows)
                if parsed.mentioned and label_text:
                    check = await llm.smart(
                        ACCURACY_SYSTEM,
                        f"Our drug: {product.brand} ({product.molecule})\n\nFDA LABEL:\n{label_text}\n\nAI ANSWER:\n{res.text}",
                        AccuracyCheck,
                        effort=settings.accuracy_effort,
                    )
                    ans.accuracy_issues = [i.model_dump() for i in check.issues]
            except Exception as exc:  # one failed cell must not sink the scan
                ans.error = str(exc)[:500]

        async with lock:
            with Session(engine) as s:
                s.add(ans)
                s.commit()
                s.refresh(ans)
            counters["answers"] += 1
            counters["errors"] += bool(ans.error)
            counters["mentions"] += ans.mentioned
            counters["competitor_mentions"] += bool(ans.competitors_mentioned)
            counters["accuracy_issues"] += len(ans.accuracy_issues)
            job.emit("answer", {
                "prompt_id": prompt.id, "engine": eng.name, "mentioned": ans.mentioned, "position": ans.position,
                "competitors_mentioned": ans.competitors_mentioned, "accuracy_issues": len(ans.accuracy_issues),
                "error": ans.error,
            })
            job.emit("counters", dict(counters))

    job.emit("counters", dict(counters))
    await asyncio.gather(*(cell(p, e) for p in prompts for e in engines))

    report_id = await build_report(scan_id)
    with Session(engine) as s:
        scan = s.get(Scan, scan_id)
        scan.status, scan.stats, scan.report_id = "done", counters, report_id
        scan.finished_at = datetime.now(timezone.utc)
        s.add(scan)
        s.commit()
    job.finish("done", {"report_id": report_id})
