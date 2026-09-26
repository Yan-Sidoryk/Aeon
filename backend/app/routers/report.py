"""Screen 6: /report/[id], "Fix this", and the save gate."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.deps import get_or_404, get_org
from app.models import Answer, Draft, Org, Report
from app.events import create_job, get_job, run_in_background
from app.routers.onboarding import stream
from app.schemas import SaveIn
from app.services import demo, fix

router = APIRouter(prefix="/api", tags=["report"])


@router.get("/reports/{report_id}", summary="Public, shareable report")
def get_report(report_id: str, session: Session = Depends(get_session)):
    report = get_or_404(session, Report, report_id)
    return {"id": report.id, "created_at": report.created_at, **report.payload}


@router.get("/reports/{report_id}/answers", summary="Full answer text for a grid cell or prompt")
def get_answers(report_id: str, prompt_id: int | None = None, engine: str | None = None,
                session: Session = Depends(get_session)):
    report = get_or_404(session, Report, report_id)
    q = select(Answer).where(Answer.scan_id == report.scan_id)
    if prompt_id is not None:
        q = q.where(Answer.prompt_id == prompt_id)
    if engine:
        q = q.where(Answer.engine == engine)
    return session.exec(q).all()


@router.post("/reports/{report_id}/fixes/{fix_key}",
             summary="'Fix this': returns {draft_id} if ready, else 202 {job_id}; stream /api/fixes/{job_id}/events")
async def create_fix(report_id: str, fix_key: str, response: Response, session: Session = Depends(get_session)):
    report = get_or_404(session, Report, report_id)
    existing = session.exec(select(Draft).where(Draft.report_id == report_id, Draft.fix_key == fix_key)).first()
    if existing:
        return {"draft_id": existing.id, "job_id": None}
    f = next((f for f in report.payload.get("fixes", []) if f["key"] == fix_key), None)
    if not f:
        raise HTTPException(404, f"fix '{fix_key}' not in report")
    if settings.demo_mode and demo.available() and (d := demo.recorded_draft(session, report, fix_key)):
        return {"draft_id": d.id, "job_id": None}
    job_id = f"fix-{report_id}-{fix_key}"
    job = get_job(job_id)
    if not job or job.done:  # a double click joins the running job
        run_in_background(fix.run_fix(create_job(job_id), report_id, f))
    response.status_code = 202
    return {"draft_id": None, "job_id": job_id}


@router.get("/fixes/{job_id}/events", summary="SSE: step events, then done {draft_id} or error {message}")
async def fix_events(job_id: str):
    return stream(job_id)


@router.get("/drafts/{draft_id}")
def get_draft(draft_id: int, session: Session = Depends(get_session)):
    return get_or_404(session, Draft, draft_id)


@router.post("/orgs/save", summary="Save gate: attach a work email to the anonymous session")
def save(body: SaveIn, org: Org = Depends(get_org), session: Session = Depends(get_session)):
    org.email = body.email.strip().lower()
    session.add(org)
    session.commit()
    return {"ok": True, "org_id": org.id, "email": org.email}
