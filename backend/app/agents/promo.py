"""Promo-opportunities agent: what competitors promote right now, and how we answer it on-label.

Claude pulls each competitor's current US search ads (Google Ads Transparency via Apify, returned as images it
reads directly), may read their landing pages with web fetch, finds the themes and claims they lead with, and
records 3-5 opportunities: an angle our FDA label supports, with the verbatim label text behind it. record_opportunity
rejects a label quote that isn't in the label, so every opportunity is on-label before anyone drafts from it."""

import json
import re

from anthropic import beta_async_tool
from sqlmodel import Session, delete

from app.agents.runner import WEB_FETCH, run_agent
from app.db import engine
from app.jobs import JobContext
from app.llm import cached
from app.models import CompetitorAd, Opportunity, Product, active_competitors
from app.observability import observe
from app.services import apify, premlr
from app.services.checks import label_text

SYSTEM = """You are Aeon's competitive promotion analyst for a US pharma brand. You find what competitors are \
promoting right now and how our brand can answer it, strictly on-label.

Workflow:
1. For each competitor, call competitor_ads with its brand website domain (e.g. "dupixent.com"). Read the ad images \
closely: headline, description, sitelinks. At most 5 competitors.
2. Optionally fetch one or two competitor landing pages with web fetch to see the claims behind the ads.
3. Group what you saw into themes (e.g. "steroid-free", "for kids from age 2", "fast itch relief", "savings card").
4. For each theme our FDA label lets us answer, call record_opportunity: the competitors using it, their claims \
quoted as they appear, our angle, a verbatim quote from our label that supports it, and a format (patient FAQ \
page, HCP email, search ad, social post). Record 3 to 5 opportunities, strongest first.

Rules: our angle must be supported by our label (below); never suggest off-label use, superiority without \
head-to-head data, or unqualified efficacy numbers. Skip themes our label can't support."""


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:48] or "opportunity"


@observe(as_type="chain", name="promo")
async def run(job: JobContext, product_id: int) -> None:
    with Session(engine) as s:  # a re-run replaces the previous research
        s.exec(delete(Opportunity).where(Opportunity.product_id == product_id))
        s.exec(delete(CompetitorAd).where(CompetitorAd.product_id == product_id))
        s.commit()
        product = s.get(Product, product_id)
        competitors = [c.brand for c in s.exec(active_competitors(product_id))]
        s.expunge_all()
    label_norm = premlr._norm(" ".join(v for v in product.label.values() if v))
    opportunities: list[dict] = []
    seen_ads: list[CompetitorAd] = []

    def step(label: str) -> None:
        job.emit("step", {"key": f"p{len(seen_ads)}-{len(opportunities)}-{label[:20]}", "label": label, "status": "done"})

    @beta_async_tool
    @observe(as_type="tool", name="competitor_ads")
    async def competitor_ads(competitor: str, domain: str) -> list[dict] | str:
        """Current US Google search ads that point at a competitor's brand site, as images to read.

        Args:
            competitor: The competitor's brand name, e.g. "Dupixent".
            domain: Its brand website domain, e.g. "dupixent.com".
        """
        domain = domain.lower().removeprefix("https://").removeprefix("http://").removeprefix("www.").strip("/")
        ads = await apify.google_search_ads(domain, limit=5)
        step(f"Pulled {len(ads)} current Google ads for {competitor}")
        if not ads:
            return f"No current US Google ads found for {domain}."
        for ad in ads:
            seen_ads.append(CompetitorAd(product_id=product_id, competitor=competitor, ad_id=ad["id"],
                                         page_name=ad["advertiser"], url=ad["url"], platforms=["google_search"],
                                         started_at=ad["first_shown"], title="", body="", cta=""))
        images = await apify.ad_images([ad["image_url"] for ad in ads])
        blocks: list[dict] = [{"type": "text", "text": f"{len(ads)} current US search ads for {competitor} ({domain}). "
                               "Each image below is one ad as Google renders it."}]
        for ad, image in zip(ads, images):
            blocks.append({"type": "text", "text": f"Ad {ad['id']} by {ad['advertiser']}, shown {ad['first_shown']} to {ad['last_shown']}:"})
            blocks.append(image or {"type": "text", "text": "(image unavailable)"})
        return blocks

    @beta_async_tool
    @observe(as_type="tool", name="record_opportunity")
    async def record_opportunity(theme: str, competitors_using_it: list[str], their_claims: list[str], our_angle: str,
                                 label_quote: str, content_format: str) -> str:
        """Record one promotion opportunity for our brand.

        Args:
            theme: Short name of the theme, e.g. "Steroid-free for young kids".
            competitors_using_it: Competitor brands promoting this theme.
            their_claims: Their ad or page claims, quoted as they appear.
            our_angle: How our brand answers it, on-label, in one or two sentences.
            label_quote: Verbatim text from OUR FDA label that supports the angle (shortest passage, under 300 characters).
            content_format: Where to use it: "patient FAQ page", "HCP email", "search ad", "social post" or similar.
        """
        if len(opportunities) >= 5:
            return "Already 5 opportunities; stop now."
        if not premlr._quote_in_label(label_quote, label_norm):
            return "Rejected: label_quote is not verbatim text from our FDA label. Quote the label exactly."
        opportunities.append({"theme": theme, "competitors": competitors_using_it, "their_claims": their_claims,
                              "our_angle": our_angle, "label_support": label_quote, "format": content_format})
        step(f"Opportunity: {theme}")
        return f"Recorded ({len(opportunities)} so far)."

    job.emit("step", {"key": "start", "label": "Looking at what competitors promote right now…", "status": "active"})
    await run_agent(
        system=cached(SYSTEM, f"OUR BRAND: {product.brand} ({product.molecule})\n\nOUR FDA LABEL:\n{label_text(product.label)}"),
        user=f"Competitors to research: {json.dumps(competitors)}", tools=[competitor_ads, WEB_FETCH, record_opportunity],
        max_iterations=20,
        on_server_tool=lambda name, inp: step(f"Reading {inp.get('url', '')}") if name == "web_fetch" else None)
    job.emit("step", {"key": "start", "label": "Checked competitors' promotion", "status": "done"})

    with Session(engine) as s:
        s.add_all(seen_ads)
        used = set()
        for o in opportunities:
            key = _slug(o["theme"])
            while key in used:
                key += "-2"
            used.add(key)
            s.add(Opportunity(product_id=product_id, key=key, theme=o["theme"], competitors=o["competitors"],
                              their_claims=o["their_claims"], our_angle=o["our_angle"],
                              label_support=o["label_support"], format=o["format"]))
        s.commit()
    job.finish("done", {"product_id": product_id, "opportunities": len(opportunities)})
