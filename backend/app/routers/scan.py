"""Screen 5: /start/scan, plus weekly tracking."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app import jobs
from app.auth import current_org, owned_product, owned_scan
from app.config import settings
from app.db import get_session
from app.engines.registry import engine_status, enabled_engines
from app.models import Org, Prompt, Scan, Schedule
from app.routers.onboarding import stream_job, stream_org
from app.services import demo

router = APIRouter(prefix="/api", tags=["scan"])


def _demo() -> bool:
    return settings.demo_mode and demo.available()


@router.get("/engines", summary="All engines: live ones, and 'coming soon' ones shown greyed out")
def list_engines():
    status = engine_status()
    if _demo():
        recorded = {a["engine"] for a in demo.load()["answers"]}
        status = [{**e, "enabled": e["name"] in recorded} for e in status]
    return status


def start_scan_job(session: Session, product_id: int, org_id: int | None, kind: str = "onboarding") -> Scan:
    names = [e["name"] for e in list_engines() if e["enabled"]]
    s = Scan(product_id=product_id, engines=names, kind=kind)
    session.add(s)
    session.commit()
    session.refresh(s)
    jobs.enqueue("scan", {"scan_id": s.id}, org_id=org_id, job_id=f"scan-{s.id}")
    return s


@router.post("/products/{product_id}/scans")
def start_scan(product_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    if not session.exec(select(Prompt).where(Prompt.product_id == product_id)).first():
        raise HTTPException(409, "Run setup first: no questions for this product")
    if not _demo() and not enabled_engines():
        raise HTTPException(503, "No AI engines configured; set ANTHROPIC_API_KEY")
    s = start_scan_job(session, product_id, org.id)
    return {"scan_id": s.id, "engines": s.engines}


@router.get("/scans/{scan_id}")
def get_scan(scan_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    return owned_scan(session, scan_id, org)


@router.get("/scans/{scan_id}/events",
            summary="SSE: answer {prompt_id, engine, ...} and counters events, then done {report_id} or error")
async def scan_events(scan_id: int, org: Org | None = Depends(stream_org)):
    return await stream_job(f"scan-{scan_id}", org)


@router.get("/products/{product_id}/scans", summary="Scan history, newest first (dashboard)")
def list_scans(product_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    return session.exec(select(Scan).where(Scan.product_id == product_id).order_by(Scan.id.desc())).all()


@router.get("/products/{product_id}/tracking")
def get_tracking(product_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    sched = session.exec(select(Schedule).where(Schedule.product_id == product_id)).first()
    return {"weekly": bool(sched and sched.active), "next_run_at": sched.next_run_at if sched and sched.active else None}


@router.put("/products/{product_id}/tracking", summary="Turn weekly re-scans on or off")
def set_tracking(product_id: int, weekly: bool, org: Org = Depends(current_org),
                 session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    sched = session.exec(select(Schedule).where(Schedule.product_id == product_id)).first()
    if not sched:
        sched = Schedule(product_id=product_id, next_run_at=datetime.now(timezone.utc) + timedelta(days=7))
    sched.active = weekly
    session.add(sched)
    session.commit()
    return get_tracking(product_id, org, session)
