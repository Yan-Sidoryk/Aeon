"""What each background job kind runs. Handlers are idempotent: a job retried after a restart starts over.

Demo mode replays one recorded live run (app/services/demo.py) through the same jobs and events."""

from sqlmodel import Session, delete, update

from app import jobs
from app.agents import discovery, fix, promo, setup
from app.config import settings
from app.db import engine
from app.engines.registry import enabled_engines
from app.jobs import JobContext
from app.models import Answer, Competitor, Opportunity, Product, Prompt, Report
from app.services import demo, scan


def _demo() -> bool:
    return settings.demo_mode and demo.available()


@jobs.handler("discovery")
async def run_discovery(ctx: JobContext, params: dict) -> None:
    company_id = params["company_id"]
    with Session(engine) as s:  # a retry must not duplicate products
        s.exec(delete(Product).where(Product.company_id == company_id))
        s.commit()
    if _demo():
        await demo.replay_discovery(ctx, company_id)
    else:
        await discovery.run(ctx, company_id, params["url"])


@jobs.handler("setup")
async def run_setup(ctx: JobContext, params: dict) -> None:
    product_id = params["product_id"]
    with Session(engine) as s:
        # retire, never delete: answers from earlier scans still point at these questions
        s.exec(update(Competitor).where(Competitor.product_id == product_id).values(active=False))
        s.exec(update(Prompt).where(Prompt.product_id == product_id).values(active=False))
        s.commit()
    if _demo() and await demo.replay_setup(ctx, product_id):
        return
    await setup.run(ctx, product_id)


@jobs.handler("scan")
async def run_scan(ctx: JobContext, params: dict) -> None:
    scan_id = params["scan_id"]
    with Session(engine) as s:
        s.exec(delete(Answer).where(Answer.scan_id == scan_id))
        s.commit()
    if _demo():
        await demo.replay_scan(ctx, scan_id)
    else:
        await scan.run_scan(ctx, scan_id, enabled_engines())


@jobs.handler("fix")
async def run_fix(ctx: JobContext, params: dict) -> None:
    if _demo() and await demo.replay_fix(ctx, params["report_id"], params["fix_key"]):
        return
    with Session(engine) as s:
        report = s.get(Report, params["report_id"])
        f = next(f for f in report.payload.get("fixes", []) if f["key"] == params["fix_key"])
    await fix.run_fix(ctx, params["report_id"], f)


@jobs.handler("promo")
async def run_promo(ctx: JobContext, params: dict) -> None:
    if _demo() and await demo.replay_promo(ctx, params["product_id"]):
        return
    await promo.run(ctx, params["product_id"])


@jobs.handler("opportunity_draft")
async def run_opportunity_draft(ctx: JobContext, params: dict) -> None:
    try:
        with Session(engine) as s:
            product = s.get(Product, params["product_id"])
            opp = s.get(Opportunity, params["opportunity_id"])
            s.expunge_all()
        brief = {"title": f"{opp.theme}: {opp.format}", "why": opp.our_angle, "kind": "promo",
                 "target_prompts": [], "wrong_statements": [],
                 "competitor_claims": opp.their_claims, "label_support": opp.label_support}
        draft = await fix.draft_with_review(ctx, product, brief, fix_key=f"opp-{opp.key}")
        ctx.finish("done", {"draft_id": draft.id})
    except Exception as exc:
        ctx.finish("error", {"message": str(exc)[:300]})
