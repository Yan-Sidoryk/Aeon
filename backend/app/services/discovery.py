"""Portfolio discovery: website → company + products + FDA labels + hero pick.

Streams checklist steps to the job so the /start screen ticks live."""

import asyncio
import json
import re

from sqlmodel import Session, select

from app import llm
from app.db import engine
from app.jobs import JobContext as Job
from app.models import Company, Product
from app.schemas import PortfolioEnrich, SiteExtract
from app.services import crawl, openfda

EXTRACT_SYSTEM = (
    "You extract structured facts about a pharmaceutical company from its website pages. "
    "List only products the company markets or develops (brand names, not molecules, when a brand exists). "
    "Mark investigational products as pipeline. company_type is a short phrase such as 'specialty pharma', "
    "'biotech', 'big pharma' or 'consumer health'. Use an empty string for anything the pages do not say."
)

ENRICH_SYSTEM = (
    "For each drug, write a one-line indication summary (max 15 words, plain language, from the label text given) "
    "and its therapeutic area. Then rank all drugs by expected US consumer search demand for the brand name, "
    "1 = highest. Return every drug given, using the brand exactly as given."
)

SUFFIX = re.compile(r"\b(inc|corp|corporation|co|llc|ltd|plc|sa|ag|gmbh|pharmaceuticals?|holdings?)\b\.?", re.I)


def clean_company(name: str) -> str:
    return re.sub(r"\s+", " ", SUFFIX.sub("", name)).strip(" ,.")


async def run_discovery(job: Job, company_id: int, url: str) -> None:
    try:
        await _discover(job, company_id, url)
    except Exception as exc:  # surface failure to the UI instead of hanging
        with Session(engine) as s:
            c = s.get(Company, company_id)
            c.status = "failed"
            s.add(c)
            s.commit()
        job.finish("error", {"message": str(exc)})


async def _discover(job: Job, company_id: int, url: str) -> None:
    def step(key: str, label: str, status: str = "done", **detail):
        job.emit("step", {"key": key, "label": label, "status": status, **detail})

    step("read", "Reading your website…", "active")

    async def progress(n: int):
        step("read", f"Reading your website… {n} pages", "active", pages=n)

    # The domain stem ("incyte") is usually the labeler name, so start openFDA alongside the crawl.
    stem = crawl.domain_of(url).split(".")[0]
    fda_guess = asyncio.create_task(openfda.labels_by_manufacturer(stem))
    pages = await crawl.crawl(url, on_progress=progress)
    step("read", f"Read {len(pages)} pages")

    step("extract", "Finding your products…", "active")
    site = await llm.fast(EXTRACT_SYSTEM, f"Website: {url}\n\n{crawl.pages_as_context(pages)}", SiteExtract)
    company_name = site.company_name or stem

    step("labels", "Pulling FDA labels…", "active")
    fda = await fda_guess
    if clean_company(company_name).lower() != stem.lower():
        fda = openfda.dedupe_latest(fda + await openfda.labels_by_manufacturer(clean_company(company_name)))
    own_labelers = {l["manufacturer"] for l in fda if l["manufacturer"]}
    by_brand = {l["brand"].lower(): l for l in fda}

    # Website names openFDA didn't list under this manufacturer (brands, or pipeline names that are
    # actually approved molecules): look them up by brand or molecule.
    def known(name: str) -> bool:  # "ruxolitinib cream" is the Opzelura molecule; "tafasitamab" is Monjuvi's
        n = name.lower()
        return n in by_brand or any(m and (n in m or m in n) for m in (l["molecule"] for l in by_brand.values()))
    missing = [p for p in site.products if not known(p.brand)]
    found = await asyncio.gather(*(openfda.label_by_name(p.brand) for p in missing), return_exceptions=True)
    resolved = set()
    for p, lab in zip(missing, found):
        if not isinstance(lab, dict):
            continue
        own = lab["manufacturer"] in own_labelers or not lab["manufacturer"]  # unindexed: benefit of the doubt
        if p.pipeline and not own:  # a pipeline name matching someone else's label is a different drug
            continue
        by_brand.setdefault(lab["brand"].lower(), lab | {"partner": not own})
        resolved.add(p.brand.lower())
    pipeline = [p for p in site.products if p.pipeline and p.brand.lower() not in resolved and not known(p.brand)]

    candidates = sorted({l["manufacturer"] for l in fda if l["indexed"]})
    for lab in by_brand.values():  # unindexed labels only know our search term; show the real labeler name
        if not lab["indexed"] and not lab.get("partner") and len(candidates) == 1:
            lab["manufacturer"] = candidates[0]
    step("extract", f"Found {len(by_brand)} products", count=len(by_brand))
    step("labels", f"Pulled {len(by_brand)} FDA labels")

    step("map", "Mapping indications…", "active")
    enrich = {}
    if by_brand:
        items = [{"brand": l["brand"], "indications": l["label"]["indications"][:1500]} for l in by_brand.values()]
        out = await llm.fast(ENRICH_SYSTEM, json.dumps(items), PortfolioEnrich)
        enrich = {e.brand.lower(): e for e in out.products}
    site_urls = {p.brand.lower(): p.url for p in site.products}

    with Session(engine) as s:
        company = s.get(Company, company_id)
        company.name = company_name
        company.hq = site.hq
        company.company_type = site.company_type
        company.labeler_candidates = candidates if len(candidates) > 1 else []
        areas = {e.therapeutic_area for e in enrich.values()} | set(site.therapeutic_areas)
        company.therapeutic_areas = sorted(a for a in areas if a)
        for key, lab in by_brand.items():
            e = enrich.get(key)
            partner = lab.get("partner", False)
            s.add(Product(
                company_id=company_id, brand=lab["brand"], molecule=lab["molecule"], tier=lab["tier"],
                indication=e.indication_one_line if e else "", label_set_id=lab["set_id"], label=lab["label"],
                url=site_urls.get(key), search_rank=e.demand_rank if e else 99,
                labeler=lab["manufacturer"], partner=partner, selected=not partner,
            ))
        for p in pipeline:  # unlaunched pipeline drugs: shown, not scanned by default
            s.add(Product(company_id=company_id, brand=p.brand, molecule=p.molecule or "", tier="Rx",
                          pipeline=True, selected=False, search_rank=999))
        s.flush()
        products = s.exec(select(Product).where(
            Product.company_id == company_id, Product.pipeline == False, Product.partner == False)).all()  # noqa: E712
        if products:
            min(products, key=lambda p: p.search_rank).is_hero = True
        company.status = "ready"
        s.add(company)
        s.commit()

    step("map", "Mapped indications")
    job.finish("done", {"company_id": company_id})
