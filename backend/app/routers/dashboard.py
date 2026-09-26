"""Dashboard: scan history, competitor promo opportunities, and drafts."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select

from app import jobs
from app.auth import current_org, owned_draft, owned_product
from app.db import get_session
from app.models import CompetitorAd, Draft, Opportunity, Org, Report, Scan
from app.routers.onboarding import stream_job, stream_org

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/products/{product_id}/history", summary="One row per finished scan: date and per-engine counts")
def history(product_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    scans = session.exec(select(Scan).where(Scan.product_id == product_id, Scan.status == "done")
                         .order_by(Scan.id.desc())).all()
    rows = []
    for scan in scans:
        report = session.get(Report, scan.report_id) if scan.report_id else None
        if not report or "summary" not in report.payload:
            continue
        rows.append({"scan_id": scan.id, "report_id": report.id, "kind": scan.kind, "finished_at": scan.finished_at,
                     "summary": report.payload["summary"], "changes": len(report.payload.get("changes") or [])})
    return rows


def promo_job_id(product_id: int) -> str:
    return f"promo-{product_id}"


@router.post("/products/{product_id}/opportunities", summary="Research competitors' promotion (202 {job_id})")
def start_promo(product_id: int, response: Response, org: Org = Depends(current_org),
                session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    response.status_code = 202
    return {"job_id": jobs.enqueue("promo", {"product_id": product_id}, org_id=org.id, job_id=promo_job_id(product_id))}


@router.get("/promo/{job_id}/events", summary="SSE: agent step events, then done or error")
async def promo_events(job_id: str, org: Org | None = Depends(stream_org)):
    return await stream_job(job_id, org)


@router.get("/products/{product_id}/opportunities")
def list_opportunities(product_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    opps = session.exec(select(Opportunity).where(Opportunity.product_id == product_id).order_by(Opportunity.id)).all()
    ads = session.exec(select(CompetitorAd).where(CompetitorAd.product_id == product_id)).all()
    drafts = {d.fix_key: d.id for d in session.exec(select(Draft).where(Draft.product_id == product_id))}
    job = jobs.get_job(promo_job_id(product_id))
    return {
        "status": job.status if job else None,
        "opportunities": [o.model_dump() | {"draft_id": drafts.get(f"opp-{o.key}")} for o in opps],
        "ads": [{"competitor": a.competitor, "advertiser": a.page_name, "first_shown": a.started_at, "url": a.url,
                 "ad_id": a.ad_id} for a in ads],
    }


@router.post("/products/{product_id}/opportunities/{key}/draft",
             summary="Draft an on-label answer to a competitor theme: {draft_id} if ready, else 202 {job_id}")
def draft_opportunity(product_id: int, key: str, response: Response, org: Org = Depends(current_org),
                      session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    opp = session.exec(select(Opportunity).where(Opportunity.product_id == product_id, Opportunity.key == key)).first()
    if not opp:
        raise HTTPException(404, f"No opportunity '{key}'")
    existing = session.exec(select(Draft).where(Draft.product_id == product_id, Draft.fix_key == f"opp-{key}")).first()
    if existing:
        return {"draft_id": existing.id, "job_id": None}
    job_id = jobs.enqueue("opportunity_draft", {"product_id": product_id, "opportunity_id": opp.id}, org_id=org.id,
                          job_id=f"oppdraft-{product_id}-{key}")
    response.status_code = 202
    return {"draft_id": None, "job_id": job_id}


@router.get("/products/{product_id}/drafts")
def list_drafts(product_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    drafts = session.exec(select(Draft).where(Draft.product_id == product_id).order_by(Draft.id.desc())).all()
    return [{"id": d.id, "title": d.title, "fix_key": d.fix_key, "report_id": d.report_id,
             "status": (d.premlr or {}).get("status"), "rounds": len(d.rounds or [])} for d in drafts]


@router.get("/drafts/{draft_id}/full")
def draft_full(draft_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    return owned_draft(session, draft_id, org)
