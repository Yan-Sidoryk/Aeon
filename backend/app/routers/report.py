"""Screen 6: /report/[id], "Fix this", and the save gate."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from app import jobs
from app.auth import current_org, owned_draft, owned_scan
from app.config import settings
from app.db import get_session
from app.models import Answer, Draft, Org, Report
from app.routers.onboarding import stream_job, stream_org
from app.schemas import SaveIn
from app.services import demo

router = APIRouter(prefix="/api", tags=["report"])


def _report(session: Session, report_id: str) -> Report:
    report = session.get(Report, report_id)
    if report is None:
        raise HTTPException(404, f"Report {report_id} not found")
    return report


@router.get("/reports/{report_id}", summary="Public, shareable report")
def get_report(report_id: str, session: Session = Depends(get_session)):
    report = _report(session, report_id)
    return {"id": report.id, "created_at": report.created_at, **report.payload}


@router.get("/reports/{report_id}/answers", summary="Full answer text for a grid cell or question (public with the report)")
def get_answers(report_id: str, prompt_id: int | None = None, engine: str | None = None,
                session: Session = Depends(get_session)):
    report = _report(session, report_id)
    q = select(Answer).where(Answer.scan_id == report.scan_id)
    if prompt_id is not None:
        q = q.where(Answer.prompt_id == prompt_id)
    if engine:
        q = q.where(Answer.engine == engine)
    return session.exec(q.order_by(Answer.engine, Answer.sample)).all()


def fix_job_id(report_id: str, fix_key: str) -> str:
    return f"fix-{report_id}-{fix_key}"


@router.post("/reports/{report_id}/fixes/{fix_key}",
             summary="'Fix this': {draft_id} if ready, else 202 {job_id}; stream /api/fixes/{job_id}/events")
def create_fix(report_id: str, fix_key: str, response: Response, org: Org = Depends(current_org),
               session: Session = Depends(get_session)):
    report = _report(session, report_id)
    owned_scan(session, report.scan_id, org)  # drafting costs money: only the report's owner can start it
    existing = session.exec(select(Draft).where(Draft.report_id == report_id, Draft.fix_key == fix_key)).first()
    if existing:
        return {"draft_id": existing.id, "job_id": None}
    if not any(f["key"] == fix_key for f in report.payload.get("fixes", [])):
        raise HTTPException(404, f"fix '{fix_key}' not in report")
    if settings.demo_mode and demo.available() and (d := demo.recorded_draft(session, report, fix_key)):
        return {"draft_id": d.id, "job_id": None}
    # enqueue() joins a job that's already queued or running, so a double click is safe
    job_id = jobs.enqueue("fix", {"report_id": report_id, "fix_key": fix_key}, org_id=org.id,
                          job_id=fix_job_id(report_id, fix_key))
    response.status_code = 202
    return {"draft_id": None, "job_id": job_id}


@router.get("/fixes/{job_id}/events", summary="SSE: step and round events, then done {draft_id} or error {message}")
async def fix_events(job_id: str, org: Org | None = Depends(stream_org)):
    return await stream_job(job_id, org)


@router.get("/reports/{report_id}/drafts/{fix_key}", summary="A report's draft, public with the report link")
def get_report_draft(report_id: str, fix_key: str, session: Session = Depends(get_session)):
    _report(session, report_id)
    draft = session.exec(select(Draft).where(Draft.report_id == report_id, Draft.fix_key == fix_key)).first()
    if draft is None:
        raise HTTPException(404, "No draft for this fix yet")
    return draft


@router.get("/drafts/{draft_id}")
def get_draft(draft_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    return owned_draft(session, draft_id, org)


@router.post("/orgs/save", summary="Save gate: attach a work email to the account")
def save(body: SaveIn, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    org.email = body.email.strip().lower()
    session.add(org)
    session.commit()
    return {"ok": True, "org_id": org.id, "email": org.email}


@router.get("/me", summary="The caller's account")
def me(org: Org = Depends(current_org), session: Session = Depends(get_session)):
    return {"org_id": org.id, "email": org.email, "signed_in": bool(org.user_id)}


