"""Guardrails on live runs, which spend real money (Anthropic, DataForSEO, Apify).

- Visitors (anonymous accounts) get one full live report a day: discovery, setup and one scan. Also capped per
  IP address, since anonymous accounts cost nothing to create.
- Signed-in users (confirmed email) get everything, including "Fix this", promo research and weekly tracking,
  within per-account daily limits.
- All live work counts against one global daily spend cap (settings.daily_spend_cap_usd), measured per job
  (spend.py). Jobs still running count at an estimate, so a burst of starts can't all slip under the cap.

Days are UTC. Demo mode replays a recording and spends nothing, so none of this applies there."""

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from app import jobs
from app.auth import Caller
from app.config import settings
from app.models import Company, Job, Product, Schedule
from app.services import demo

VISITOR = {"discovery": 3, "setup": 3, "scan": 1}  # per anonymous account per day; other kinds need sign-in
VISITOR_PER_IP = {"discovery": 6, "setup": 6, "scan": 2}
MEMBER = {"discovery": 10, "setup": 10, "scan": 5, "fix": 15, "promo": 3, "opportunity_draft": 15}
MAX_TRACKED = 3  # drugs on weekly tracking per account
# What a job counts for while it runs; its measured cost replaces this when it finishes. A scan measured $7.90
# with the Claude engine on Opus 5; it runs on Sonnet 5 now (cheaper, not yet measured).
ESTIMATE_USD = {"discovery": 0.5, "setup": 0.3, "scan": 4.0, "fix": 1.0, "promo": 0.5, "opportunity_draft": 1.0}

SIGN_IN = {
    "fix": "Sign in to draft fixes. Your free report stays yours.",
    "promo": "Sign in to research competitors' promotion.",
    "opportunity_draft": "Sign in to draft content from an opportunity.",
}
VISITOR_LIMIT = {
    "scan": "You've used today's free report. Sign in to run more scans.",
}
VISITOR_LIMIT_DEFAULT = "You've reached today's free limit. Sign in to keep going."
OVER_CAP = "Aeon has reached today's budget for live runs. Try again tomorrow, or open the sample report."


def live() -> bool:
    return not (settings.demo_mode and demo.available())


def _today() -> datetime:
    now = datetime.now(timezone.utc)
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _started_today(session: Session, kind: str, **where) -> int:
    """Jobs of this kind started (or re-run) today. A re-queued job id reuses its row, so count by updated_at."""
    q = select(func.count()).select_from(Job).where(Job.kind == kind, Job.updated_at >= _today())
    for column, value in where.items():
        q = q.where(getattr(Job, column) == value)
    return session.exec(q).one()


def spent_today(session: Session) -> float:
    rows = session.exec(select(Job.kind, Job.status, Job.cost_usd).where(Job.updated_at >= _today())).all()
    return sum((cost or 0) if status in jobs.TERMINAL else max(cost or 0, ESTIMATE_USD.get(kind, 0))
               for kind, status, cost in rows)


def over_cap(session: Session) -> bool:
    return live() and spent_today(session) >= settings.daily_spend_cap_usd


def check(session: Session, caller: Caller, kind: str) -> None:
    """403 or 429 when this caller may not start a live job of this kind right now."""
    if not live():
        return
    if caller.signed_in:
        if kind in MEMBER and _started_today(session, kind, org_id=caller.org.id) >= MEMBER[kind]:
            raise HTTPException(429, "You've reached today's limit for this. It resets at midnight UTC.")
    else:
        if kind not in VISITOR:
            raise HTTPException(403, SIGN_IN.get(kind, "Sign in to use this."))
        mine = _started_today(session, kind, org_id=caller.org.id)
        from_ip = _started_today(session, kind, ip_hash=caller.ip_hash) if caller.ip_hash else 0
        if mine >= VISITOR[kind] or from_ip >= VISITOR_PER_IP[kind]:
            raise HTTPException(429, VISITOR_LIMIT.get(kind, VISITOR_LIMIT_DEFAULT))
    if over_cap(session):
        raise HTTPException(429, OVER_CAP)


def start(session: Session, caller: Caller, kind: str, params: dict, job_id: str | None = None) -> str:
    """Check, then queue. Joining a job that's already queued or running (a double click) is free."""
    existing = jobs.get_job(job_id) if job_id else None
    if not (existing and existing.status not in jobs.TERMINAL):
        check(session, caller, kind)
    return jobs.enqueue(kind, params, org_id=caller.org.id, job_id=job_id, ip_hash=caller.ip_hash)


def check_tracking(session: Session, caller: Caller, product_id: int) -> None:
    """Weekly tracking re-runs a paid scan every week: signed-in users only, a few drugs each."""
    if not live():
        return
    if not caller.signed_in:
        raise HTTPException(403, "Sign in to track this drug every week.")
    tracked = session.exec(select(func.count()).select_from(Schedule)
                           .join(Product, Product.id == Schedule.product_id)
                           .join(Company, Company.id == Product.company_id)
                           .where(Company.org_id == caller.org.id, Schedule.active == True,  # noqa: E712
                                  Schedule.product_id != product_id)).one()
    if tracked >= MAX_TRACKED:
        raise HTTPException(429, f"You can track up to {MAX_TRACKED} drugs every week. Turn one off first.")
