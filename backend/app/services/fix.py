"""'Fix this': a label-grounded draft, run through pre-MLR before anyone sees it."""

import json

from sqlmodel import Session

from app import llm
from app.config import settings
from app.db import engine
from app.events import Job
from app.models import Draft, Product, Report
from app.schemas import DraftOut
from app.services import premlr

DRAFT_SYSTEM = (
    "You write US pharma web content that must pass MLR review. The FDA label below is your ONLY source: every "
    "factual statement about the drug must be supported by it, and each claim is listed in `claims` with the label "
    "section and a verbatim label quote. Stay strictly on-label (approved indication, population and dosing). "
    "Write plain-language, AI-answer-ready content: a direct answer block first, then short sections and a Q&A. "
    "No superlatives, no 'safe' or 'cure', no comparisons without head-to-head data, and qualify efficacy with "
    "'in clinical studies'. Give risk information fair balance, and end with an '## Important Safety "
    "Information' section built from the label (boxed warning first, verbatim, if the label has one). "
    "content_md is Markdown, 500-900 words. At most 12 claims; label_quote is the shortest verbatim label "
    "passage that supports the claim (under 300 characters)."
)


async def run_fix(job: Job, report_id: str, fix: dict) -> None:
    """Background job for the 'Fix this' button: step events, then done {draft_id} or error."""
    try:
        with Session(engine) as session:
            draft = await create_draft(session, session.get(Report, report_id), fix,
                                       on_step=lambda key, label: job.emit("step", {"key": key, "label": label}))
            job.finish("done", {"draft_id": draft.id})
    except Exception as exc:
        job.finish("error", {"message": str(exc)})


async def create_draft(session: Session, report: Report, fix: dict, on_step=None) -> Draft:
    step = on_step or (lambda key, label: None)
    product = session.get(Product, report.payload["product"]["id"])
    label_text = "\n\n".join(f"[{k}]\n{v}" for k, v in product.label.items() if v)
    related = [i for i in report.payload["accuracy_issues"] if i["prompt"] in fix.get("target_prompts", [])]
    user = (
        f"Brand: {product.brand} ({product.molecule}), {product.tier}\n"
        f"Task: {fix['title']}\nWhy: {fix['why']}\nKind: {fix['kind']}\n"
        f"Questions this page must answer directly: {json.dumps(fix.get('target_prompts', []))}\n"
        f"Wrong AI statements to correct (if any): {json.dumps(related)}\n\nFDA LABEL:\n{label_text}"
    )
    step("draft", "Drafting from the FDA label…")
    out = await llm.smart(DRAFT_SYSTEM, user, DraftOut, effort=settings.draft_effort)
    claims = [c.model_dump() for c in out.claims]
    step("review", "Running pre-MLR checks…")
    review = await premlr.review(out.content_md, claims, product.label, product.brand)
    draft = Draft(report_id=report.id, fix_key=fix["key"], title=out.title, content_md=out.content_md,
                  claims=claims, premlr=review)
    session.add(draft)
    session.commit()
    session.refresh(draft)
    return draft
