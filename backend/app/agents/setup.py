"""Setup agent (screens 3→4): competitors + the 10 questions we'll ask AI about the hero drug.

Claude pulls real questions people ask Google (DataForSEO "People also ask" and question searches), verifies every
competitor against its US FDA label, and records exactly 6 unbranded, 2 branded and 2 comparison questions. The
record tools enforce the rules (an unbranded question may not name a drug, a competitor needs its own FDA label from
another company), so the agent gets told when it's wrong and corrects itself."""

import json
import re

from anthropic import beta_async_tool
from sqlmodel import Session, select

from app.agents.runner import run_agent
from app.config import settings
from app.db import engine
from app.jobs import JobContext
from app.models import Competitor, Product, Prompt
from app.observability import observe
from app.services import dataforseo, openfda

QUOTA = {"unbranded": 6, "branded": 2, "comparison": 2}
AUDIENCES = ("patient", "caregiver", "hcp")

SYSTEM = f"""You are Aeon's setup agent. For one US prescription or OTC drug you pick the competitors to track and \
the questions Aeon will ask AI assistants about it.

Competitors: 4 to 6 branded, US-marketed drugs that patients and doctors consider instead of this drug for the same \
indication. Not supportive care or generic-only molecules, and nothing from the same manufacturer. Check each with \
check_fda_label, then record_competitor (it rejects drugs without a US label).

Questions: exactly {QUOTA['unbranded']} unbranded, {QUOTA['branded']} branded and {QUOTA['comparison']} comparison \
questions, as real people type them into AI assistants.
- Unbranded: about the condition and its treatment, naming no drug at all. These measure whether AI recommends the \
drug on its own, so they matter most. Prefer real questions from questions_people_ask and question_searches, kept \
close to their original wording; mark them from_google.
- Branded: name the drug (how it's used, side effects, who it's for, cost).
- Comparison: the drug vs one recorded competitor.
- Mix audiences: mostly patients, some caregivers, 2-3 doctors (clinical wording).
Use at most 3 DataForSEO calls in total. Stop once record_question says all quotas are filled."""


def _names(*items: str) -> list[str]:
    out = []
    for item in items:
        for part in re.split(r"[\s/(),-]+", item or ""):
            if len(part) >= 4:
                out.append(part.lower())
    return out


@observe(as_type="chain", name="setup")
async def run(job: JobContext, product_id: int) -> None:
    with Session(engine) as s:
        product = s.get(Product, product_id)
        own_brands = {p.brand.lower() for p in s.exec(select(Product).where(Product.company_id == product.company_id))}
        s.expunge_all()
    indication = product.label.get("indications", "")[:2500]
    competitors: list[dict] = []
    questions: list[dict] = []

    def step(label: str) -> None:
        job.emit("step", {"key": f"s{len(questions) + len(competitors)}-{label[:24]}", "label": label, "status": "done"})

    @beta_async_tool
    @observe(as_type="tool", name="questions_people_ask")
    async def questions_people_ask(search_query: str) -> str:
        """Real questions from Google's "People also ask" box for a search (US).

        Args:
            search_query: A condition or treatment search, e.g. "eczema treatment for kids". Never a brand name.
        """
        found = await dataforseo.people_also_ask(search_query, click_depth=1)
        step(f"Read what people ask Google about “{search_query}”")
        return json.dumps(found[:12]) if found else "No questions found for that search."

    @beta_async_tool
    @observe(as_type="tool", name="question_searches")
    async def question_searches(topic: str) -> str:
        """Question-shaped Google searches containing a topic, with US monthly search volume.

        Args:
            topic: A condition or treatment term, e.g. "atopic dermatitis". Never a brand name.
        """
        found = await dataforseo.question_keywords(topic, limit=25)
        step(f"Looked up the most-searched questions about “{topic}”")
        return json.dumps(found[:25]) if found else "No question searches found."

    @beta_async_tool
    @observe(as_type="tool", name="check_fda_label")
    async def check_fda_label(drug_name: str) -> str:
        """Look up a drug's US FDA label.

        Args:
            drug_name: Brand or generic name.
        """
        lab = await openfda.label_by_name(drug_name)
        if not lab:
            return f"No US FDA label found for {drug_name}."
        return json.dumps({"brand": lab["brand"], "molecule": lab["molecule"], "labeler": lab["manufacturer"],
                           "indication": lab["label"]["indications"][:400]})

    @beta_async_tool
    @observe(as_type="tool", name="record_competitor")
    async def record_competitor(brand: str) -> str:
        """Record a competitor to track. It must have a US FDA label from another company.

        Args:
            brand: The competitor's brand name.
        """
        if len(competitors) >= 6:
            return "Already 6 competitors; that's the maximum."
        lab = await openfda.label_by_name(brand)
        if not lab:
            return f"Rejected: no US FDA label found for {brand}."
        if lab["brand"].lower() in own_brands or (product.labeler and lab["manufacturer"] == product.labeler):
            return f"Rejected: {lab['brand']} is made by the same company."
        if any(c["brand"].lower() == lab["brand"].lower() for c in competitors):
            return f"{lab['brand']} is already recorded."
        competitors.append({"brand": lab["brand"], "molecule": lab["molecule"]})
        step(f"Competitor: {lab['brand']} ({lab['molecule']}), FDA label verified")
        return f"Recorded {lab['brand']}. {len(competitors)} competitors so far."

    @beta_async_tool
    @observe(as_type="tool", name="record_question")
    async def record_question(text: str, audience: str, kind: str, from_google: bool = False) -> str:
        """Record one question Aeon will ask AI assistants.

        Args:
            text: The question, as a person would type it.
            audience: "patient", "caregiver" or "hcp".
            kind: "unbranded", "branded" or "comparison".
            from_google: True if it comes from questions_people_ask or question_searches.
        """
        text = text.strip()
        if kind not in QUOTA or audience not in AUDIENCES:
            return f"Rejected: kind must be one of {list(QUOTA)} and audience one of {list(AUDIENCES)}."
        if sum(q["kind"] == kind for q in questions) >= QUOTA[kind]:
            return f"Rejected: the {kind} quota is full. Remaining: {_remaining()}"
        lower = text.lower()
        ours = _names(product.brand, product.molecule)
        theirs = _names(*[c["brand"] for c in competitors], *[c["molecule"] for c in competitors])
        if kind == "unbranded" and any(n in lower for n in ours + theirs):
            return "Rejected: an unbranded question may not name any drug."
        if kind in ("branded", "comparison") and not any(n in lower for n in ours):
            return f"Rejected: a {kind} question must name {product.brand}."
        if kind == "comparison" and not any(n in lower for n in theirs):
            return "Rejected: a comparison question must name a recorded competitor."
        if any(q["text"].lower() == lower for q in questions):
            return "Already recorded."
        questions.append({"text": text, "audience": audience, "kind": kind, "from_google": from_google})
        step(f"Question: {text}")
        left = _remaining()
        return f"Recorded. Remaining: {left}" if left else "Recorded. All quotas are filled: stop now."

    def _remaining() -> dict:
        return {k: n - sum(q["kind"] == k for q in questions) for k, n in QUOTA.items()
                if n - sum(q["kind"] == k for q in questions) > 0}

    job.emit("step", {"key": "start", "label": f"Researching {product.brand}'s competitors and questions…", "status": "active"})
    tools = [check_fda_label, record_competitor, record_question]
    if settings.dataforseo_enabled:
        tools = [questions_people_ask, question_searches, *tools]
    await run_agent(
        system=SYSTEM,
        user=(f"Drug: {product.brand} ({product.molecule}), {product.tier}, labeled by {product.labeler or 'unknown'}.\n"
              f"Same company's other products (not competitors): {sorted(own_brands - {product.brand.lower()})}\n\n"
              f"FDA-approved indication:\n{indication}"),
        tools=tools, max_iterations=30)
    job.emit("step", {"key": "start", "label": f"Researched {product.brand}", "status": "done"})

    if not questions or not any(q["kind"] == "unbranded" for q in questions):
        raise RuntimeError("The setup agent didn't produce any unbranded questions")
    with Session(engine) as s:
        s.add_all(Competitor(product_id=product_id, brand=c["brand"], molecule=c["molecule"], source="openfda")
                  for c in competitors)
        s.add_all(Prompt(product_id=product_id, text=q["text"], audience=q["audience"], lane=q["kind"],
                         source="google_paa" if q["from_google"] else "claude") for q in questions)
        s.commit()
    job.finish("done", {"product_id": product_id, "competitors": len(competitors), "questions": len(questions)})
