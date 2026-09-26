"""What each background job kind runs. Handlers are idempotent: a job retried after a restart starts over."""

from sqlmodel import Session, delete

from app import jobs
from app.config import settings
from app.db import engine
from app.engines.registry import enabled_engines
from app.jobs import JobContext
from app.models import Answer, Competitor, Product, Prompt, Report
from app.services import demo, discovery, fix, scan, setup


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
        await discovery.run_discovery(ctx, company_id, params["url"])


@jobs.handler("setup")
async def run_setup(ctx: JobContext, params: dict) -> None:
    product_id = params["product_id"]
    with Session(engine) as s:
        product = s.get(Product, product_id)
        s.exec(delete(Competitor).where(Competitor.product_id == product_id))
        s.exec(delete(Prompt).where(Prompt.product_id == product_id))
        s.commit()
        if _demo() and demo.seed_setup(s, product):
            ctx.finish("done", {"product_id": product_id})
            return
        await setup.run_setup(ctx, s, product)


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
    with Session(engine) as s:
        report = s.get(Report, params["report_id"])
        f = next(f for f in report.payload.get("fixes", []) if f["key"] == params["fix_key"])
    await fix.run_fix(ctx, params["report_id"], f)

