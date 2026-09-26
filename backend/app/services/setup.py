"""Screen 4: competitors + the prompt set for the hero drug."""

import asyncio
import json

from sqlmodel import Session, delete, select

from app import llm
from app.config import settings
from app.models import Competitor, Product, Prompt
from app.schemas import CompetitorPick, PromptSet
from app.services import openfda

COMPETITOR_SYSTEM = (
    "You are a US pharma market analyst. Given a drug and its FDA-approved indication, list the 4-6 branded "
    "US-marketed drugs patients and doctors most often consider instead of it for the same indication. "
    "Only branded products (e.g. 'Inrebic'), never generic-only molecules, and not supportive or background "
    "therapies such as steroids or chemotherapy staples. "
    "Exclude the drug itself and anything from the same manufacturer (its other products are listed). Use brand names and generic molecule names."
)

PROMPT_SYSTEM = (
    "You write the questions real people type into AI assistants (ChatGPT, Gemini, Perplexity) about a condition "
    "and its treatments. Write natural, varied questions, as a patient, caregiver or doctor would ask them. "
    "Mix of lanes: about 40% 'unbranded' (condition and treatment questions that never name a drug), 30% 'branded' "
    "(name the brand, about its approved use, dosing, side effects, cost, how it works), 20% 'comparison' "
    "(brand vs a named competitor), 10% 'off_label' (uses, populations or doses outside the approved indication). "
    "Audience mix: about 50% patient, 20% caregiver, 30% hcp. HCP questions use clinical wording."
)


async def _lookup(c) -> dict | None:
    for name in (c.brand, c.molecule):
        try:
            if name and (lab := await openfda.label_by_name(name)):
                return lab
        except Exception:
            pass
    return None


async def _verify_competitors(product: Product, picked: CompetitorPick, own: set[str]) -> list[Competitor]:
    """Keep FDA-labeled competitors, named as on the label (a molecule like 'fedratinib' becomes 'Inrebic').
    Unverified LLM picks only fill in when fewer than 3 are verified."""
    labels = await asyncio.gather(*(_lookup(c) for c in picked.competitors))
    verified, unverified, seen = [], [], set(own)
    for c, lab in zip(picked.competitors, labels):
        brand, molecule = (lab["brand"], lab["molecule"]) if lab else (c.brand, c.molecule)
        if brand.lower() in seen:
            continue
        seen.add(brand.lower())
        target = verified if lab else unverified
        target.append(Competitor(product_id=product.id, brand=brand, molecule=molecule,
                                 source="openfda" if lab else "llm"))
    return (verified + (unverified if len(verified) < 3 else []))[:6]


async def build_setup(session: Session, product: Product) -> None:
    own = {p.brand.lower() for p in session.exec(select(Product).where(Product.company_id == product.company_id))}
    ind = product.label.get("indications", "")[:2500]
    who = f"Drug: {product.brand} ({product.molecule}). Indication from the FDA label:\n{ind}"

    siblings = sorted(own - {product.brand.lower()})
    # Opus, not Haiku: Haiku invented brands ("Vondelesnib") and returned pipeline molecules.
    picked = await llm.smart(COMPETITOR_SYSTEM, f"{who}\n\nSame manufacturer's other products: {siblings}",
                             CompetitorPick, effort="low")
    competitors = await _verify_competitors(product, picked, own)

    user = (
        f"{who}\n\nCompetitors: {json.dumps([c.brand for c in competitors])}\n\n"
        f"Write exactly {settings.prompts_per_product} questions."
    )
    prompts = (await llm.fast(PROMPT_SYSTEM, user, PromptSet)).prompts[: settings.prompts_per_product]

    session.exec(delete(Competitor).where(Competitor.product_id == product.id))
    session.exec(delete(Prompt).where(Prompt.product_id == product.id))
    session.add_all(competitors)
    session.add_all(
        Prompt(product_id=product.id, text=p.text, audience=p.audience, lane=p.lane, monitor_only=p.lane == "off_label")
        for p in prompts
    )
    session.commit()
