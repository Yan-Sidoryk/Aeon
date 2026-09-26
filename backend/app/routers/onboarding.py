"""Screens 1-4: /start, /start/portfolio, /start/hero, /start/setup."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlmodel import Session, select
from sse_starlette.sse import EventSourceResponse

from app import jobs
from app.auth import current_org, owned_company, owned_competitor, owned_product
from app.config import settings
from app.db import get_session
from app.models import Company, Competitor, Org, Product, Prompt, active_competitors, active_prompts
from app.schemas import AddProductIn, CompetitorIn, LabelerIn, OnboardingIn, ProductPatch, PromptIn
from app.services import crawl, openfda

router = APIRouter(prefix="/api", tags=["onboarding"])


async def stream_job(job_id: str, org: Org | None) -> EventSourceResponse:
    """SSE for one job. With auth on, only the job's owner can follow it (token passed as ?access_token=)."""
    job = jobs.get_job(job_id)
    if not job or (settings.auth_enabled and (org is None or job.org_id != org.id)):
        raise HTTPException(404, "Job not found")
    return EventSourceResponse(jobs.stream(job_id))


async def stream_org(access_token: str | None = None, session: Session = Depends(get_session)) -> Org | None:
    """Caller of an SSE stream: EventSource can't send headers, so auth comes from the query string."""
    if not settings.auth_enabled:
        return None
    return await current_org(authorization=None, x_session_id=None, access_token=access_token, session=session)


@router.post("/onboarding")
def start_onboarding(body: OnboardingIn, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    company = Company(org_id=org.id, domain=crawl.domain_of(body.url))
    session.add(company)
    session.commit()
    session.refresh(company)
    job_id = jobs.enqueue("discovery", {"company_id": company.id, "url": body.url}, org_id=org.id)
    return {"job_id": job_id, "company_id": company.id}


@router.get("/onboarding/{job_id}/events", summary="SSE: step events, then done {company_id} or error {message}")
async def onboarding_events(job_id: str, org: Org | None = Depends(stream_org)):
    return await stream_job(job_id, org)


def company_view(session: Session, company: Company) -> dict:
    products = session.exec(select(Product).where(Product.company_id == company.id)
                            .order_by(Product.pipeline, Product.search_rank)).all()
    return {**company.model_dump(), "products": [p.model_dump(exclude={"label"}) | {
        "label_found": bool(p.label_set_id), "has_boxed_warning": bool(p.label.get("boxed_warning"))}
        for p in products]}


@router.get("/companies")
def list_companies(org: Org = Depends(current_org), session: Session = Depends(get_session)):
    """The caller's companies, newest first (dashboard brand switcher)."""
    companies = session.exec(select(Company).where(Company.org_id == org.id, Company.status == "ready")
                             .order_by(Company.id.desc())).all()
    return [company_view(session, c) for c in companies]


@router.get("/companies/{company_id}")
def get_company(company_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    return company_view(session, owned_company(session, company_id, org))


@router.post("/companies/{company_id}/labeler", summary="'Which of these are you?': keep one labeler's products")
def choose_labeler(company_id: int, body: LabelerIn, org: Org = Depends(current_org),
                   session: Session = Depends(get_session)):
    company = owned_company(session, company_id, org)
    if body.labeler not in company.labeler_candidates:
        raise HTTPException(422, f"'{body.labeler}' is not one of this company's labelers")
    products = session.exec(select(Product).where(Product.company_id == company_id, Product.pipeline == False)  # noqa: E712
                            .order_by(Product.search_rank)).all()
    for p in products:  # another labeler's products become partner products: shown, unticked, never the hero
        if p.labeler and p.labeler != body.labeler:
            p.partner, p.selected, p.is_hero = True, False, False
    if not any(p.is_hero for p in products) and (own := [p for p in products if not p.partner]):
        own[0].is_hero = True
    company.labeler_candidates = []
    session.add_all([company, *products])
    session.commit()
    return company_view(session, company)


@router.patch("/products/{product_id}")
def patch_product(product_id: int, body: ProductPatch, org: Org = Depends(current_org),
                  session: Session = Depends(get_session)):
    product = owned_product(session, product_id, org)
    product.selected = body.selected
    session.add(product)
    session.commit()
    return {"ok": True}


@router.post("/companies/{company_id}/products")
async def add_product(company_id: int, body: AddProductIn, org: Org = Depends(current_org),
                      session: Session = Depends(get_session)):
    owned_company(session, company_id, org)
    lab = await openfda.label_by_name(body.brand)
    if not lab:
        raise HTTPException(404, f"No US FDA label found for '{body.brand}'")
    own = {p.labeler for p in session.exec(select(Product).where(Product.company_id == company_id)) if p.labeler}
    partner = bool(own and lab["manufacturer"] and lab["manufacturer"] not in own)
    product = Product(company_id=company_id, brand=lab["brand"], molecule=lab["molecule"], tier=lab["tier"],
                      label_set_id=lab["set_id"], label=lab["label"], label_version=lab.get("effective_time", ""),
                      search_rank=50, labeler=lab["manufacturer"],
                      partner=partner, indication=lab["label"]["indications"][:140])
    session.add(product)
    session.commit()
    session.refresh(product)
    return product.model_dump(exclude={"label"})


@router.get("/products/{product_id}")
def get_product(product_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    return owned_product(session, product_id, org)


@router.post("/products/{product_id}/hero")
def set_hero(product_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    product = owned_product(session, product_id, org)
    for p in session.exec(select(Product).where(Product.company_id == product.company_id)):
        p.is_hero = p.id == product_id
        session.add(p)
    session.commit()
    return {"ok": True}


def setup_view(session: Session, product_id: int) -> dict:
    competitors = session.exec(active_competitors(product_id)).all()
    prompts = session.exec(active_prompts(product_id)).all()
    return {
        "competitors": [c.model_dump() for c in competitors],
        # lane stays internal: the UI never shows it during onboarding
        "prompts": [p.model_dump(exclude={"lane", "active"}) | {"kind": p.lane} for p in prompts],
        "markets": ["US"],
        "languages": ["en"],
    }


def setup_job_id(product_id: int) -> str:
    return f"setup-{product_id}"


@router.post("/products/{product_id}/setup",
             summary="Competitors + questions: 200 with the setup when it exists, else 202 {job_id} (setup agent)")
def build_setup(product_id: int, response: Response, regenerate: bool = False, org: Org = Depends(current_org),
                session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    has = session.exec(active_prompts(product_id)).first()
    if has and not regenerate:
        return {"setup": setup_view(session, product_id), "job_id": None}
    job_id = jobs.enqueue("setup", {"product_id": product_id}, org_id=org.id, job_id=setup_job_id(product_id))
    response.status_code = 202
    return {"setup": None, "job_id": job_id}


@router.get("/setup/{job_id}/events", summary="SSE: agent step events, then done {product_id} or error")
async def setup_events(job_id: str, org: Org | None = Depends(stream_org)):
    return await stream_job(job_id, org)


@router.get("/products/{product_id}/setup")
def read_setup(product_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    return setup_view(session, product_id)


@router.post("/products/{product_id}/competitors")
def add_competitor(product_id: int, body: CompetitorIn, org: Org = Depends(current_org),
                   session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    c = Competitor(product_id=product_id, brand=body.brand, molecule=body.molecule, source="user")
    session.add(c)
    session.commit()
    session.refresh(c)
    return c


@router.delete("/competitors/{competitor_id}")
def delete_competitor(competitor_id: int, org: Org = Depends(current_org), session: Session = Depends(get_session)):
    session.delete(owned_competitor(session, competitor_id, org))
    session.commit()
    return {"ok": True}


@router.put("/products/{product_id}/prompts", summary="Replace the question set")
def replace_prompts(product_id: int, body: list[PromptIn], org: Org = Depends(current_org),
                    session: Session = Depends(get_session)):
    owned_product(session, product_id, org)
    # Keep each existing question's hidden lane: the setup view never sends it back.
    current = session.exec(active_prompts(product_id)).all()
    lanes = {p.text: p.lane for p in current}
    for p in current:  # retire, never delete: past answers point at them
        p.active = False
        session.add(p)
    for p in body:
        lane = p.lane if "lane" in p.model_fields_set else lanes.get(p.text, "unbranded")
        session.add(Prompt(product_id=product_id, text=p.text, audience=p.audience, lane=lane,
                           monitor_only=lane == "off_label", source="user" if p.text not in lanes else "claude"))
    session.commit()
    return setup_view(session, product_id)
