"""Screen 5: ask every question on every engine, turn each answer into yes/no checks, and stream one cell per
question × engine to the grid.

Claude's answers vary, so each question is asked several times (settings.claude_samples) and a cell's checks are a
majority vote. Google shows one AI Overview per query, so it's fetched once; "no overview shown" is its own state.
Measurement is a plain workflow, not an agent: an agent's instructions would change the answers we measure."""

import asyncio
import json
from datetime import datetime, timezone

from sqlmodel import Session

from app import llm
from app.config import settings
from app.db import engine
from app.engines.base import Engine
from app.jobs import JobContext
from app.models import Answer, Company, Competitor, Product, Prompt, Scan, active_competitors, active_prompts
from app.observability import observe
from app.schemas import AccuracyCheck, AnswerParse
from app.services.checks import aggregate_cell, cites_owned, label_text, owned_domains
from app.services.report import build_report

PARSE_SYSTEM = (
    "You analyse an AI assistant's answer. Say whether it mentions our brand (by brand or molecule name), the "
    "rank at which our brand appears among treatments named (1 = first, null if not mentioned), which of the "
    "listed competitors it mentions (by brand or molecule; return the brand name exactly as listed), and the "
    "sentiment toward our brand."
)

ACCURACY_SYSTEM = (
    "You are a medical information reviewer. Compare what an AI answer says about OUR drug with its FDA label, "
    "given below. Report only statements about our drug that contradict or materially misstate the label: a wrong "
    "dose, amount, area or schedule; a wrong or unapproved indication or population; a boxed warning denied or "
    "misstated when safety is discussed; wrong contraindications. Quote the AI sentence and the closest label "
    "sentence verbatim.\n"
    "Not issues: statements that match the label for at least one approved indication or population; leaving out "
    "details the answer doesn't claim to cover (e.g. mentioning the twice-daily dosing without the tube limit); "
    "statements about other drugs. When in doubt, it is not an issue. Return an empty list when the answer is accurate."
)


def match_competitors(names: list[str], comp_rows: list[Competitor]) -> list[str]:
    """Map whatever the parser returned ("Eucrisa (crisaborole)", "dupilumab") to our competitor brands."""
    found = []
    for c in comp_rows:
        keys = [k for k in (c.brand.lower(), c.molecule.lower()) if k]
        if any(k in n.lower() or n.lower() in k for n in names for k in keys if n):
            found.append(c.brand)
    return found


@observe(as_type="chain", name="scan")
async def run_scan(job: JobContext, scan_id: int, engines: list[Engine]) -> None:
    try:
        await _scan(job, scan_id, engines)
    except Exception as exc:
        with Session(engine) as s:
            scan = s.get(Scan, scan_id)
            scan.status = "failed"
            s.add(scan)
            s.commit()
        job.finish("error", {"message": str(exc)[:300]})


async def _scan(job: JobContext, scan_id: int, engines: list[Engine]) -> None:
    with Session(engine) as s:
        scan = s.get(Scan, scan_id)
        product = s.get(Product, scan.product_id)
        company = s.get(Company, product.company_id)
        prompts = s.exec(active_prompts(product.id)).all()
        comp_rows = s.exec(active_competitors(product.id)).all()
        s.expunge_all()

    engines = [e for e in engines if e.name in scan.engines] or engines
    comp_list = [f"{c.brand} ({c.molecule})" if c.molecule else c.brand for c in comp_rows]
    ours = f"Our brand: {product.brand} (molecule: {product.molecule})\nCompetitors: {json.dumps(comp_list)}"
    label = label_text(product.label)
    accuracy_system = llm.cached(ACCURACY_SYSTEM, f"Our drug: {product.brand} ({product.molecule})\n\nFDA LABEL:\n{label}")
    owned = owned_domains(company, product)

    counters = {"answers": 0, "total": len(prompts) * len(engines), "mentions": 0, "competitor_mentions": 0,
                "accuracy_issues": 0, "errors": 0, "not_shown": 0}
    sem = asyncio.Semaphore(settings.scan_concurrency)
    lock = asyncio.Lock()

    async def sample(prompt: Prompt, eng: Engine, i: int) -> Answer:
        ans = Answer(scan_id=scan_id, prompt_id=prompt.id, engine=eng.name, sample=i)
        async with sem:
            try:
                res = await eng.ask(prompt.text)
                ans.text, ans.citations, ans.shown = res.text, res.citations, res.shown
                ans.cites_you = cites_owned(res.citations, owned)
                if res.shown and res.text:
                    parsed = await llm.fast(PARSE_SYSTEM, f"{ours}\n\nQuestion: {prompt.text}\n\nAnswer:\n{res.text}",
                                            AnswerParse)
                    ans.mentioned, ans.position, ans.sentiment = parsed.mentioned, parsed.position, parsed.sentiment
                    ans.competitors_mentioned = match_competitors(parsed.competitors_mentioned, comp_rows)
                    if parsed.mentioned and label:
                        check = await llm.parse(settings.model_accuracy, accuracy_system, f"AI ANSWER:\n{res.text}",
                                                AccuracyCheck, effort=settings.accuracy_effort)
                        ans.accuracy_issues = [iss.model_dump() for iss in check.issues]
            except Exception as exc:  # one failed sample must not sink the scan
                ans.error = str(exc)[:500]
        with Session(engine) as s:
            s.add(ans)
            s.commit()
            s.refresh(ans)
            s.expunge(ans)
        return ans

    async def cell(prompt: Prompt, eng: Engine) -> None:
        answers = await asyncio.gather(*(sample(prompt, eng, i) for i in range(eng.samples)))
        agg = aggregate_cell(list(answers))
        async with lock:
            counters["answers"] += 1
            counters["errors"] += agg["state"] == "error"
            counters["not_shown"] += agg["state"] == "not_shown"
            counters["mentions"] += agg["state"] == "you"
            counters["competitor_mentions"] += bool(agg.get("competitors_mentioned"))
            counters["accuracy_issues"] += bool(agg.get("label_conflict"))
            job.emit("answer", {"prompt_id": prompt.id, "engine": eng.name, **agg,
                                "accuracy_issues": agg.get("accuracy_issues", 0), "error": agg.get("error")})
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
