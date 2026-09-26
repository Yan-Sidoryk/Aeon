"""Yes/no checks: turning answers into grid cells (majority vote over samples) and citations into sources."""

from collections import Counter
from statistics import median
from urllib.parse import urlparse

from app.models import Answer, Company, Product


def label_text(label: dict) -> str:
    return "\n\n".join(f"[{k}]\n{v}" for k, v in label.items() if v)


def _domain(url: str) -> str:
    return urlparse(url).netloc.lower().removeprefix("www.")


def owned_domains(company: Company, product: Product) -> list[str]:
    """Stems that mark a citation as the company's own site: incyte.com, opzelura.com, hcp.opzelura.com …"""
    stems = {company.domain.lower().removeprefix("www.").split(".")[0], product.brand.lower().replace(" ", "")}
    if product.url:
        stems.add(_domain(product.url).split(".")[0])
    return sorted(s for s in stems if len(s) >= 3)


def cites_owned(citations: list[dict], owned: list[str]) -> bool:
    return any(any(stem in _domain(c.get("url", "")) for stem in owned) for c in citations)


def aggregate_cell(answers: list[Answer]) -> dict:
    """Majority vote over one question × engine's samples → the grid cell."""
    ok = [a for a in answers if not a.error]
    base = {"samples": len(answers)}
    if not ok:
        return {**base, "state": "error", "error": (answers[0].error if answers else "no answer")}
    shown = [a for a in ok if a.shown]
    if not shown:
        return {**base, "state": "not_shown", "mentioned": False, "competitors_mentioned": [], "label_conflict": False,
                "accuracy_issues": 0, "cites_you": False, "votes": f"0/{len(ok)}", "position": None}
    n = len(shown)
    majority = n // 2 + 1
    yes = sum(a.mentioned for a in shown)
    mentioned = yes >= majority
    counts = Counter(c for a in shown for c in set(a.competitors_mentioned))
    competitors = sorted(c for c, k in counts.items() if k >= majority) or \
        ([c for c, _ in counts.most_common(1)] if not mentioned and counts else [])
    named_rival = sum(bool(a.competitors_mentioned) for a in shown) >= majority
    with_issues = sum(bool(a.accuracy_issues) for a in shown if a.mentioned)
    positions = [a.position for a in shown if a.mentioned and a.position]
    return {
        **base,
        "state": "you" if mentioned else ("competitor" if named_rival else "none"),
        "mentioned": mentioned,
        "votes": f"{yes}/{n}",
        "position": int(median(positions)) if mentioned and positions else None,
        "competitors_mentioned": competitors,
        "label_conflict": mentioned and with_issues >= max(1, (yes // 2) + 1),
        "accuracy_issues": sum(len(a.accuracy_issues) for a in shown),
        "cites_you": sum(a.cites_you for a in shown) >= majority,
    }
