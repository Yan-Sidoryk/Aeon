"""Screen 5: /start/scan."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.deps import get_or_404
from app.engines.registry import enabled_engines, engine_status
from app.events import create_job, run_in_background
from app.models import Prompt, Product, Scan
from app.routers.onboarding import stream
from app.services import demo, scan

router = APIRouter(prefix="/api", tags=["scan"])


def _demo() -> bool:
    return settings.demo_mode and demo.available()


@router.get("/engines", summary="All engines; disabled ones are shown greyed out in the grid")
def list_engines():
    status = engine_status()
    if _demo():
        recorded = {a["engine"] for a in demo.load()["answers"]}
        status = [{**e, "enabled": e["name"] in recorded} for e in status]
    return status


@router.post("/products/{product_id}/scans")
async def start_scan(product_id: int, session: Session = Depends(get_session)):
    get_or_404(session, Product, product_id)
    if not session.exec(select(Prompt).where(Prompt.product_id == product_id)).first():
        raise HTTPException(409, "Run setup first: no prompts for this product")
    engines = [] if _demo() else enabled_engines()
    if not _demo() and not engines:
        raise HTTPException(503, "No AI engines configured; set ANTHROPIC_API_KEY")
    names = [e["name"] for e in list_engines() if e["enabled"]] if _demo() else [e.name for e in engines]
    s = Scan(product_id=product_id, engines=names)
    session.add(s)
    session.commit()
    session.refresh(s)
    job = create_job(f"scan-{s.id}")
    run_in_background(demo.replay_scan(job, s.id) if _demo() else scan.run_scan(job, s.id, engines))
    return {"scan_id": s.id, "engines": names}


@router.get("/scans/{scan_id}")
def get_scan(scan_id: int, session: Session = Depends(get_session)):
    return get_or_404(session, Scan, scan_id)


@router.get("/scans/{scan_id}/events",
            summary="SSE: answer {prompt_id, engine, ...} and counters events, then done {report_id} or error")
async def scan_events(scan_id: int):
    return stream(f"scan-{scan_id}")
