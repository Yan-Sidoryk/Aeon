"""Discovery agent (screen 1): website → company + products with FDA labels.

Claude reads the site with web fetch, decides which names are the company's products, and confirms each one
against openFDA through tools. Every tool call and page read streams to the UI as a checklist row, so the user
watches the agent work. After the loop, code does the deterministic parts: partner detection, one-line
indications, and the hero pick by real Google search volume (DataForSEO)."""

import asyncio
import json
import logging
import re

from anthropic import beta_async_tool
from pydantic import BaseModel
from sqlmodel import Session, select

from app import llm
from app.agents.runner import WEB_FETCH, run_agent
from app.config import settings
from app.db import engine
from app.jobs import JobContext
from app.models import Company, Product
from app.observability import observe
from app.services import crawl, dataforseo, openfda

log = logging.getLogger("aeon.discovery")

SYSTEM = """You are Aeon's discovery agent. Given a US pharmaceutical company's website, you identify the company \
and every drug product it markets or develops, and confirm each marketed product against its US FDA label.

How to work:
- Start by fetching the homepage. Then fetch the few pages most likely to list products (products, medicines, \
portfolio, pipeline) and, if needed, linked brand sites. Read at most 6 pages; skip investor, careers, news and legal pages.
- Call find_company_labels once with the company's legal or common name to see which FDA labels it holds.
- Call record_company once you know the company's name, HQ, type and therapeutic areas.
- Call record_product for every product you find: brand names (not molecules) when a brand exists. Mark \
investigational products as pipeline. record_product looks up the FDA label itself and tells you what it found.
- Products labeled by another company (licensed or co-marketed) are still recorded; the tool marks them.
- Don't guess: only record products the pages or labels support. Stop when every product is recorded."""


class Enrich(BaseModel):
    class Item(BaseModel):
        brand: str
        indication_one_line: str
        therapeutic_area: str

    products: list[Item]


ENRICH_SYSTEM = ("For each drug, write a one-line indication summary (max 15 words, plain language, from the label text "
                 "given) and its therapeutic area. Return every drug given, using the brand exactly as given.")


@observe(as_type="chain", name="discovery")
async def run(job: JobContext, company_id: int, url: str) -> None:
    try:
        await _discover(job, company_id, url)
    except Exception as exc:  # surface failure to the UI instead of hanging
        log.exception("discovery failed")
        with Session(engine) as s:
            c = s.get(Company, company_id)
            c.status = "failed"
            s.add(c)
            s.commit()
        job.finish("error", {"message": str(exc)[:300]})


async def _discover(job: JobContext, company_id: int, url: str) -> None:
    home = crawl.normalize_url(url)
    domain = crawl.domain_of(url)
    company: dict = {}
    products: dict[str, dict] = {}  # brand (lower) -> product fields incl. label
    own_labelers: set[str] = set()
    step_n = {"n": 0}

    def step(label: str, status: str = "done", key: str | None = None, **detail) -> None:
        step_n["n"] += 1
        job.emit("step", {"key": key or f"s{step_n['n']}", "label": label, "status": status, **detail})

    def on_server_tool(name: str, inp: dict) -> None:
        if name == "web_fetch" and inp.get("url"):
            step(f"Reading {inp['url'].removeprefix('https://').removeprefix('http://').rstrip('/')}")
        elif name == "web_search" and inp.get("query"):
            step(f"Searching the web for “{inp['query']}”")

    @beta_async_tool
    @observe(as_type="tool", name="find_company_labels")
    async def find_company_labels(company_name: str) -> str:
        """List the US FDA drug labels held by a company (as labeler/manufacturer).

        Args:
            company_name: The company's name, e.g. "Incyte" or "Incyte Corporation".
        """
        labels = await openfda.labels_by_manufacturer(company_name)
        own_labelers.update(l["manufacturer"] for l in labels if l["manufacturer"] and l["indexed"])
        step(f"Found {len(labels)} FDA labels held by {company_name}")
        return json.dumps([{"brand": l["brand"], "molecule": l["molecule"], "labeler": l["manufacturer"],
                            "tier": l["tier"]} for l in labels][:60])

    @beta_async_tool
    @observe(as_type="tool", name="record_company")
    async def record_company(name: str, hq: str, company_type: str, therapeutic_areas: list[str]) -> str:
        """Record the company card.

        Args:
            name: Company name without legal suffixes, e.g. "Incyte".
            hq: Headquarters city and state/country, or "" if unknown.
            company_type: Short phrase such as "specialty pharma", "biotech", "big pharma", "consumer health".
            therapeutic_areas: Therapeutic areas the company works in.
        """
        company.update(name=name, hq=hq, company_type=company_type, therapeutic_areas=therapeutic_areas)
        step(f"Company: {name}")
        return "recorded"

    @beta_async_tool
    @observe(as_type="tool", name="record_product")
    async def record_product(brand: str, molecule: str = "", url: str = "", pipeline: bool = False) -> str:
        """Record one product the company markets or develops. Looks up its US FDA label.

        Args:
            brand: Brand name (or the code/molecule name for an unnamed pipeline asset).
            molecule: Generic (INN) name if known.
            url: The product's page or brand site, if seen.
            pipeline: True if investigational (not approved).
        """
        key = brand.lower().strip()
        if key in products:
            return f"{brand} is already recorded"
        lab = None
        if not pipeline:
            lab = await openfda.label_by_name(brand) or (await openfda.label_by_name(molecule) if molecule else None)
        if lab and lab["brand"].lower() in products:  # "Jakafi XR" resolves to Jakafi's label
            return f"{brand} resolves to {lab['brand']}'s FDA label, which is already recorded"
        if lab:
            partner = bool(own_labelers and lab["manufacturer"] and lab["manufacturer"] not in own_labelers)
            products[lab["brand"].lower()] = {"brand": lab["brand"], "molecule": lab["molecule"], "tier": lab["tier"],
                                              "label_set_id": lab["set_id"], "label": lab["label"], "url": url or None,
                                              "labeler": lab["manufacturer"], "partner": partner, "pipeline": False}
            who = f", labeled by {lab['manufacturer']}" if partner else ""
            step(f"{lab['brand']}: FDA label found{who}")
            return f"Recorded {lab['brand']} ({lab['molecule']}), {lab['tier']}, labeler {lab['manufacturer']}" + \
                   (" — a partner product (another company's label)" if partner else "")
        products[key] = {"brand": brand, "molecule": molecule, "tier": "Rx", "label_set_id": None, "label": {},
                         "url": url or None, "labeler": "", "partner": False, "pipeline": True}
        step(f"{brand}: pipeline (no FDA label)" if pipeline else f"{brand}: no US FDA label, listed as pipeline")
        return f"Recorded {brand} as pipeline (no US FDA label)"

    step(f"Reading {domain}", "active", key="start")
    messages = await run_agent(
        system=SYSTEM,
        user=f"Company website: {home}\nFind the company and all its products.",
        tools=[WEB_FETCH, find_company_labels, record_company, record_product],
        on_server_tool=on_server_tool, max_iterations=30)
    step(f"Read {domain}", key="start")
    del messages

    launched = [p for p in products.values() if not p["pipeline"]]
    if not launched:
        raise RuntimeError(f"No US FDA-labeled products found for {domain}. Is this a US pharma company site?")

    step("Mapping indications…", "active", key="map")
    items = [{"brand": p["brand"], "indications": p["label"].get("indications", "")[:1500]} for p in launched]
    enrich_task = llm.fast(ENRICH_SYSTEM, json.dumps(items), Enrich)
    volume_task = _search_volume([p["brand"] for p in launched])
    enrich, volumes = await asyncio.gather(enrich_task, volume_task)
    by_brand = {e.brand.lower(): e for e in enrich.products}
    step("Mapped indications", key="map")

    with Session(engine) as s:
        c = s.get(Company, company_id)
        c.name = re.sub(r"\s+(inc|corp|corporation|llc|ltd|plc)\.?$", "", company.get("name") or domain.split(".")[0],
                        flags=re.I).strip()
        c.hq, c.company_type = company.get("hq", ""), company.get("company_type", "")
        c.labeler_candidates = sorted(own_labelers) if len(own_labelers) > 1 else []
        areas = set(company.get("therapeutic_areas") or []) | {e.therapeutic_area for e in enrich.products}
        c.therapeutic_areas = sorted(a for a in areas if a)
        for p in products.values():
            e = by_brand.get(p["brand"].lower())
            rank = -volumes.get(p["brand"].lower(), 0) if not p["pipeline"] else 10**9
            s.add(Product(company_id=company_id, brand=p["brand"], molecule=p["molecule"], tier=p["tier"],
                          indication=e.indication_one_line if e else "", label_set_id=p["label_set_id"],
                          label=p["label"], url=p["url"], search_rank=rank, labeler=p["labeler"],
                          partner=p["partner"], pipeline=p["pipeline"],
                          selected=not p["partner"] and not p["pipeline"]))
        s.flush()
        own = s.exec(select(Product).where(Product.company_id == company_id, Product.pipeline == False,  # noqa: E712
                                           Product.partner == False)).all()  # noqa: E712
        if own:
            min(own, key=lambda p: p.search_rank).is_hero = True  # most Google searches for the brand name
        c.status = "ready"
        s.add(c)
        s.commit()
    job.finish("done", {"company_id": company_id})


async def _search_volume(brands: list[str]) -> dict[str, int]:
    if not settings.dataforseo_enabled:
        return {}
    try:
        return await dataforseo.brand_search_volume(brands)
    except Exception:  # the hero pick falls back to discovery order
        log.warning("brand search volume unavailable", exc_info=True)
        return {}
