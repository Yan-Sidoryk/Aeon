"""Fix-this agent: an evaluator-optimizer loop.

Claude drafts label-grounded content, calls check_draft (the pre-MLR checklist: deterministic FDA/OPDP rules plus
an AI reviewer), reads which checks failed, revises, and checks again, until every check passes or it runs out
of rounds. Each round streams to the UI. The final draft is the last one that was checked."""

import json

from anthropic import beta_async_tool
from sqlmodel import Session

from app.agents.runner import run_agent
from app.config import settings
from app.db import engine
from app.jobs import JobContext
from app.llm import cached
from app.models import Draft, Product, Report
from app.observability import observe, score
from app.services import premlr
from app.services.checks import label_text

SYSTEM = """You write US pharma content that must pass MLR review. The FDA label below is your ONLY source: every \
factual statement about the drug must be supported by it, and each claim goes in `claims` with its label section \
and the shortest verbatim label quote that supports it (under 300 characters).

Stay strictly on-label (approved indication, population and dosing). No superlatives, no "safe" or "cure", no \
comparisons without head-to-head data, and qualify efficacy with "in clinical studies". Give risk information fair \
balance, and end with an "## Important Safety Information" section built from the label (boxed warning first, \
verbatim, if the label has one). Write plain-language, AI-answer-ready Markdown: a direct answer block first, then \
short sections and a short Q&A, 400-800 words, at most 12 claims.

Workflow: write the draft, then call check_draft with it. If any check fails, revise exactly what the failed checks \
and flags point at and call check_draft again. Stop as soon as every check passes, or when check_draft says no rounds \
are left. Don't reply with the draft as text; check_draft is how you hand it in."""

SECTIONS = {"indications", "dosage", "boxed_warning", "contraindications", "warnings", "adverse_reactions"}


@observe(as_type="chain", name="fix")
async def draft_with_review(job: JobContext, product: Product, brief: dict, *, fix_key: str,
                            report_id: str | None = None) -> Draft:
    """brief: {title, why, kind, target_prompts, wrong_statements?}. Returns the saved Draft."""
    rounds: list[dict] = []
    latest: dict = {}

    @beta_async_tool
    @observe(as_type="tool", name="check_draft")
    async def check_draft(title: str, content_md: str, claims: list[dict[str, str]]) -> str:
        """Run the pre-MLR checklist on a draft. Returns each check's result and the reviewer's flags.

        Args:
            title: The page title.
            content_md: The full draft in Markdown.
            claims: Every factual claim: [{"text": ..., "label_section": one of indications, dosage, boxed_warning, contraindications, warnings, adverse_reactions, "label_quote": verbatim label text}].
        """
        if len(rounds) >= settings.fix_max_rounds:
            return "No rounds left. The last checked draft is final; stop now."
        clean = [{"text": str(c.get("text", "")), "label_section": str(c.get("label_section", "")),
                  "label_quote": str(c.get("label_quote", ""))} for c in claims]
        result = await premlr.review(content_md, clean, product.label, product.brand)
        latest.update(title=title, content_md=content_md, claims=clean, premlr=result)
        failed = [c["label"] for c in result["checks"] if not c["passed"]]
        rounds.append({"round": len(rounds) + 1, "status": result["status"], "failed": failed,
                       "checks": [{k: c[k] for k in ("id", "label", "passed")} for c in result["checks"]]})
        job.emit("round", rounds[-1])
        job.emit("step", {"key": f"round-{len(rounds)}", "status": "done",
                          "label": f"Round {len(rounds)}: all checks pass" if not failed
                          else f"Round {len(rounds)}: {len(failed)} check{'s' if len(failed) > 1 else ''} to fix, revising…"})
        if not failed:
            return "All checks pass. Stop now."
        left = settings.fix_max_rounds - len(rounds)
        notes = [{"rule": f["rule"], "severity": f["severity"], "excerpt": f["excerpt"][:300], "fix": f["suggestion"]}
                 for f in result["flags"] if f["severity"] in ("high", "medium")]
        return json.dumps({"failed_checks": failed, "flags": notes[:12], "rounds_left": left})

    job.emit("step", {"key": "draft", "label": "Drafting from the FDA label…", "status": "active"})
    user = (f"Brand: {product.brand} ({product.molecule}), {product.tier}\n"
            f"Task: {brief['title']}\nWhy: {brief.get('why', '')}\nKind: {brief.get('kind', '')}\n"
            f"Questions this page must answer directly: {json.dumps(brief.get('target_prompts', []))}\n"
            f"Wrong AI statements to correct (if any): {json.dumps(brief.get('wrong_statements', []))[:6000]}"
            + (f"\nCompetitor claims this answers (don't copy or compare): {json.dumps(brief['competitor_claims'])}"
               if brief.get("competitor_claims") else "")
            + (f"\nLabel text behind our angle: {brief['label_support']}" if brief.get("label_support") else ""))
    await run_agent(system=cached(SYSTEM, f"FDA LABEL for {product.brand}:\n{label_text(product.label)}"),
                    user=user, tools=[check_draft], effort=settings.draft_effort, max_iterations=12)
    job.emit("step", {"key": "draft", "label": "Drafted from the FDA label", "status": "done"})
    if not latest:
        raise RuntimeError("The draft was never checked")

    score("fix_all_checks_pass", latest["premlr"]["status"] == "ready", f"{len(rounds)} round(s)")
    with Session(engine) as s:
        draft = Draft(report_id=report_id, product_id=product.id, fix_key=fix_key, title=latest["title"],
                      content_md=latest["content_md"], claims=latest["claims"], premlr=latest["premlr"], rounds=rounds)
        s.add(draft)
        s.commit()
        s.refresh(draft)
        s.expunge(draft)
    return draft


async def run_fix(job: JobContext, report_id: str, fix: dict) -> None:
    """Background job for the report's 'Fix this' button."""
    try:
        with Session(engine) as s:
            report = s.get(Report, report_id)
            product = s.get(Product, report.payload["product"]["id"])
            s.expunge_all()
        wrong = [i for i in report.payload.get("accuracy_issues", []) if i.get("prompt") in fix.get("target_prompts", [])]
        draft = await draft_with_review(job, product, {**fix, "wrong_statements": wrong}, fix_key=fix["key"],
                                        report_id=report_id)
        job.finish("done", {"draft_id": draft.id})
    except Exception as exc:
        job.finish("error", {"message": str(exc)[:300]})
