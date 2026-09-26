"""Screen 6: turn scan answers into the shareable report."""

import json
import math
import re
from collections import Counter, defaultdict
from urllib.parse import urlparse

from sqlmodel import Session, select

from app import llm
from app.db import engine
from app.models import Answer, Company, Competitor, Product, Prompt, Report, Scan
from app.schemas import FixPlan

FIX_SYSTEM = (
    "You are a pharma search and AI-visibility strategist. From the scan findings, propose the 3 highest-impact "
    "fixes the brand team can make. Accuracy corrections come first when there are high-severity issues. Every "
    "fix must be doable with on-label, compliant content (no off-label promotion, no paid endorsements). "
    "Keys are short lowercase slugs. target_prompts copies question texts verbatim from the findings (up to 3)."
)


def wilson(k: int, n: int, z: float = 1.96) -> tuple[float, float]:
    """95% confidence interval for a proportion; AI answers are noisy, so we always show it."""
    if n == 0:
        return (0.0, 0.0)
    p = k / n
    d = 1 + z * z / n
    c = (p + z * z / (2 * n)) / d
    h = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return (round(max(0, c - h) * 100), round(min(1, c + h) * 100))


def _domain(url: str) -> str:
    return urlparse(url).netloc.removeprefix("www.")


def aggregate(product: Product, prompts: list[Prompt], competitors: list[str], answers: list[Answer],
              owned_domains: tuple[str, ...] = ()) -> dict:
    ok = [a for a in answers if not a.error]
    n = len(ok)
    prompt_by_id = {p.id: p for p in prompts}

    def share(k: int, n: int) -> dict:
        return {"score": round(100 * k / n) if n else 0, "mentions": k, "n": n, "ci95": wilson(k, n)}

    # Visibility is measured where AI chooses what to recommend: questions that don't name any drug.
    # Branded questions mention us by construction, so they would inflate the score.
    unbranded = [a for a in ok if prompt_by_id[a.prompt_id].lane == "unbranded"]
    scope, pool = ("unbranded", unbranded) if unbranded else ("all", ok)
    you = share(sum(a.mentioned for a in pool), len(pool))
    comp = {c: share(sum(c in a.competitors_mentioned for a in pool), len(pool)) for c in competitors}
    top = max(comp.items(), key=lambda kv: kv[1]["score"], default=(None, share(0, 0)))

    by_engine = defaultdict(list)
    for a in pool:
        by_engine[a.engine].append(a)
    engines = {
        e: {"n": len(xs), "you": round(100 * sum(a.mentioned for a in xs) / len(xs)),
            "top_competitor": round(100 * sum(top[0] in a.competitors_mentioned for a in xs) / len(xs)) if top[0] else 0}
        for e, xs in by_engine.items()
    }

    accuracy = [
        {**issue, "engine": a.engine, "prompt": prompt_by_id[a.prompt_id].text}
        for a in ok for issue in a.accuracy_issues
    ]
    accuracy.sort(key=lambda i: {"high": 0, "medium": 1, "low": 2}[i["severity"]])

    lost = Counter()
    winners = defaultdict(set)
    for a in ok:
        p = prompt_by_id[a.prompt_id]
        if a.competitors_mentioned and not a.mentioned and not p.monitor_only:
            lost[a.prompt_id] += 1
            winners[a.prompt_id].update(a.competitors_mentioned)
    lost_prompts = [
        {"prompt_id": pid, "prompt": prompt_by_id[pid].text, "audience": prompt_by_id[pid].audience,
         "engines_lost": k, "competitors": sorted(winners[pid])}
        for pid, k in lost.most_common(3)
    ]

    # Sources behind answers that recommend competitors but not us, minus our own sites.
    owned = [k for k in (product.brand.lower(), *owned_domains) if k]
    comp_sources = Counter()
    comp_sources_who = defaultdict(set)
    for a in ok:
        if a.competitors_mentioned and not a.mentioned:
            for d in {_domain(c["url"]) for c in a.citations if not any(k in _domain(c["url"]) for k in owned)}:
                comp_sources[d] += 1
                comp_sources_who[d].update(a.competitors_mentioned)
    sources = [{"domain": d, "citations": k, "competitors": sorted(comp_sources_who[d])} for d, k in comp_sources.most_common(5)]

    grid = [
        {"prompt_id": a.prompt_id, "engine": a.engine, "mentioned": a.mentioned, "position": a.position,
         "competitors_mentioned": a.competitors_mentioned, "accuracy_issues": len(a.accuracy_issues)}
        for a in ok
    ]

    return {
        "product": {"id": product.id, "brand": product.brand, "molecule": product.molecule,
                    "indication": product.indication, "tier": product.tier},
        "headline": {"scope": scope, "you": you, "top_competitor": {"brand": top[0], **top[1]}},
        "all_prompts": {"you": share(sum(a.mentioned for a in ok), n)},
        "competitors": comp,
        "engines": engines,
        "accuracy_issues": accuracy,
        "lost_prompts": lost_prompts,
        "competitor_only_sources": sources,
        "prompts": [{"id": p.id, "text": p.text, "audience": p.audience} for p in prompts],
        "grid": grid,
        "methodology": f"{n} answers, 1 sample per prompt per engine, web search on. Visibility = % of answers to {scope} questions "
                       f"(n={len(pool)}) that mention the brand, with a 95% Wilson interval.",
    }


def fallback_fixes(payload: dict) -> list[dict]:
    fixes = []
    if payload["accuracy_issues"]:
        i = payload["accuracy_issues"][0]
        fixes.append({"key": "correct-" + i["type"], "title": f"Correct the {i['type'].replace('_', ' ')} AI states",
                      "why": i["explanation"], "kind": "accuracy_correction", "target_prompts": [i["prompt"]]})
    for lp in payload["lost_prompts"]:
        fixes.append({"key": f"win-{lp['prompt_id']}", "title": f"Answer: “{lp['prompt']}”",
                      "why": f"{', '.join(lp['competitors'])} are recommended here and you are not.",
                      "kind": "on_page_content", "target_prompts": [lp["prompt"]]})
    return fixes[:3]


async def build_report(scan_id: int) -> str:
    with Session(engine) as s:
        scan = s.get(Scan, scan_id)
        product = s.get(Product, scan.product_id)
        company = s.get(Company, product.company_id)
        prompts = list(s.exec(select(Prompt).where(Prompt.product_id == product.id)))
        competitors = [c.brand for c in s.exec(select(Competitor).where(Competitor.product_id == product.id))]
        answers = list(s.exec(select(Answer).where(Answer.scan_id == scan_id)))
        payload = aggregate(product, prompts, competitors, answers, owned_domains=(company.domain.split(".")[0],))
        payload["company"] = {"name": company.name, "domain": company.domain}
        s.expunge_all()

    findings = {k: payload[k] for k in ("headline", "accuracy_issues", "lost_prompts", "competitor_only_sources")}
    try:
        plan = await llm.smart(FIX_SYSTEM, f"Brand: {product.brand}\n\n{json.dumps(findings)[:30000]}", FixPlan)
        payload["fixes"] = [f.model_dump() for f in plan.fixes[:3]]
        for i, f in enumerate(payload["fixes"]):  # keys are used in URLs
            f["key"] = re.sub(r"[^a-z0-9]+", "-", f["key"].lower()).strip("-") or f"fix-{i + 1}"
    except Exception:
        payload["fixes"] = fallback_fixes(payload)

    with Session(engine) as s:
        report = Report(scan_id=scan_id, payload=payload)
        s.add(report)
        s.commit()
        return report.id
