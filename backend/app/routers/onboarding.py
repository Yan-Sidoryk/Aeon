"""Screens 1-4: /start, /start/portfolio, /start/hero, /start/setup."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, delete, select
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.db import get_session
from app.deps import get_or_404, get_org
from app.events import create_job, get_job, run_in_background
from app.models import Company, Competitor, Org, Product, Prompt
from app.schemas import AddProductIn, CompetitorIn, LabelerIn, OnboardingIn, ProductPatch, PromptIn
from app.services import crawl, demo, discovery, openfda, setup

router = APIRouter(prefix="/api", tags=["onboarding"])


def stream(job_id: str) -> EventSourceResponse:
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "job not found (server restarted?); poll the resource instead")
    return EventSourceResponse(job.stream())


@router.post("/onboarding")
async def start_onboarding(body: OnboardingIn, org: Org = Depends(get_org), session: Session = Depends(get_session)):
    company = Company(org_id=org.id, domain=crawl.domain_of(body.url))
    session.add(company)
    session.commit()
    session.refresh(company)
    job_id = f"discovery-{company.id}"
    job = create_job(job_id)
    if settings.demo_mode and demo.available():
        run_in_background(demo.replay_discovery(job, company.id))
    else:
        run_in_background(discovery.run_discovery(job, company.id, body.url))
    return {"job_id": job_id, "company_id": company.id}


@router.get("/onboarding/{job_id}/events", summary="SSE: step events, then done {company_id} or error {message}")
async def onboarding_events(job_id: str):
    return stream(job_id)


@router.get("/companies/{company_id}")
def get_company(company_id: int, session: Session = Depends(get_session)):
    company = get_or_404(session, Company, company_id)
    products = session.exec(select(Product).where(Product.company_id == company_id)
                            .order_by(Product.pipeline, Product.search_rank)).all()
    return {**company.model_dump(), "products": [p.model_dump(exclude={"label"}) | {
        "label_found": bool(p.label_set_id), "has_boxed_warning": bool(p.label.get("boxed_warning"))}
        for p in products]}


@router.post("/companies/{company_id}/labeler", summary="'Which of these are you?': keep one labeler's products")
def choose_labeler(company_id: int, body: LabelerIn, session: Session = Depends(get_session)):
    company = get_or_404(session, Company, company_id)
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
    return get_company(company_id, session)


@router.patch("/products/{product_id}")
def patch_product(product_id: int, body: ProductPatch, session: Session = Depends(get_session)):
    product = get_or_404(session, Product, product_id)
    product.selected = body.selected
    session.add(product)
    session.commit()
    return {"ok": True}


@router.post("/companies/{company_id}/products")
async def add_product(company_id: int, body: AddProductIn, session: Session = Depends(get_session)):
    get_or_404(session, Company, company_id)
    lab = await openfda.label_by_name(body.brand)
    if not lab:
        raise HTTPException(404, f"No US FDA label found for '{body.brand}'")
    own = {p.labeler for p in session.exec(select(Product).where(Product.company_id == company_id)) if p.labeler}
    partner = bool(own and lab["manufacturer"] and lab["manufacturer"] not in own)
    product = Product(company_id=company_id, brand=lab["brand"], molecule=lab["molecule"], tier=lab["tier"],
                      label_set_id=lab["set_id"], label=lab["label"], search_rank=50, labeler=lab["manufacturer"],
                      partner=partner, indication=lab["label"]["indications"][:140])
    session.add(product)
    session.commit()
    session.refresh(product)
    return product.model_dump(exclude={"label"})


@router.get("/products/{product_id}")
def get_product(product_id: int, session: Session = Depends(get_session)):
    return get_or_404(session, Product, product_id)


@router.post("/products/{product_id}/hero")
def set_hero(product_id: int, session: Session = Depends(get_session)):
    product = get_or_404(session, Product, product_id)
    for p in session.exec(select(Product).where(Product.company_id == product.company_id)):
        p.is_hero = p.id == product_id
        session.add(p)
    session.commit()
    return {"ok": True}


def setup_view(session: Session, product_id: int) -> dict:
    competitors = session.exec(select(Competitor).where(Competitor.product_id == product_id)).all()
    prompts = session.exec(select(Prompt).where(Prompt.product_id == product_id)).all()
    return {
        "competitors": [c.model_dump() for c in competitors],
        # lane stays internal: the UI never shows it during onboarding
        "prompts": [p.model_dump(exclude={"lane"}) for p in prompts],
        "markets": ["US"],
        "languages": ["en"],
    }


@router.post("/products/{product_id}/setup", summary="Generate competitors + prompts (idempotent per product)")
async def build_setup(product_id: int, regenerate: bool = False, session: Session = Depends(get_session)):
    product = get_or_404(session, Product, product_id)
    has = session.exec(select(Prompt).where(Prompt.product_id == product_id)).first()
    if not has or regenerate:
        if not (settings.demo_mode and demo.available() and not has and demo.seed_setup(session, product)):
            await setup.build_setup(session, product)
    return setup_view(session, product_id)


@router.get("/products/{product_id}/setup")
def read_setup(product_id: int, session: Session = Depends(get_session)):
    return setup_view(session, product_id)


@router.post("/products/{product_id}/competitors")
def add_competitor(product_id: int, body: CompetitorIn, session: Session = Depends(get_session)):
    get_or_404(session, Product, product_id)
    c = Competitor(product_id=product_id, brand=body.brand, molecule=body.molecule, source="user")
    session.add(c)
    session.commit()
    session.refresh(c)
    return c


@router.delete("/competitors/{competitor_id}")
def delete_competitor(competitor_id: int, session: Session = Depends(get_session)):
    session.delete(get_or_404(session, Competitor, competitor_id))
    session.commit()
    return {"ok": True}


@router.put("/products/{product_id}/prompts", summary="Replace the prompt set")
def replace_prompts(product_id: int, body: list[PromptIn], session: Session = Depends(get_session)):
    get_or_404(session, Product, product_id)
    session.exec(delete(Prompt).where(Prompt.product_id == product_id))
    session.add_all(Prompt(product_id=product_id, text=p.text, audience=p.audience, lane=p.lane,
                           monitor_only=p.lane == "off_label") for p in body)
    session.commit()
    return setup_view(session, product_id)
