"""Weekly tracking: re-run each tracked drug's scan when it's due. Runs in the API process next to the job
worker; the schedule lives in the database, so a restart just picks up where it left off."""

import asyncio
import logging
from datetime import datetime, timedelta, timezone

from sqlmodel import Session, select

from app.config import settings
from app.db import engine
from app.models import Company, Product, Schedule

log = logging.getLogger("aeon.scheduler")


def run_due(now: datetime | None = None) -> list[int]:
    """Start a scan for every schedule that's due; returns the new scan ids."""
    from app.routers.scan import start_scan_job

    now = now or datetime.now(timezone.utc)
    started = []
    with Session(engine) as s:
        for sched in s.exec(select(Schedule).where(Schedule.active == True)).all():  # noqa: E712
            due = sched.next_run_at if sched.next_run_at.tzinfo else sched.next_run_at.replace(tzinfo=timezone.utc)
            if due > now:
                continue
            product = s.get(Product, sched.product_id)
            company = s.get(Company, product.company_id) if product else None
            if not company:
                sched.active = False
            else:
                scan = start_scan_job(s, product.id, company.org_id, kind="weekly")
                sched.last_scan_id = scan.id
                started.append(scan.id)
            sched.next_run_at = now + timedelta(days=sched.every_days)
            s.add(sched)
        s.commit()
    if started:
        log.info("weekly scans started: %s", started)
    return started


async def scheduler() -> None:
    while True:
        try:
            await asyncio.to_thread(run_due)
        except Exception:
            log.exception("weekly scheduler tick failed")
        await asyncio.sleep(settings.weekly_scan_check_seconds)
