"""AI pre-MLR review: deterministic US (FDA/OPDP) rules plus an LLM claim-matching pass.

Deterministic rules run first and never depend on the model, so reviewers can trust
that the hard checks (ISI present, boxed warning, banned language) always fire."""

import re

from app import llm
from app.config import settings
from app.schemas import ClaimReview

SEVERITY_WEIGHT = {"high": 25, "medium": 10, "low": 3}

BANNED = [
    (r"\bcures?\b|\bcured\b", "Implies a cure; use approved efficacy language."),
    (r"\b(completely |totally |perfectly )?safe\b", "Absolute safety claims are not allowed; describe the safety profile with risk information."),
    (r"\bno side effects\b|\bside[- ]effect[- ]free\b", "Every drug has risks; remove."),
    (r"\bguarantee[sd]?\b", "Outcome guarantees are not allowed."),
    (r"\b(the )?best\b|#1|\bnumber one\b|\bsuperior\b", "Superlative or comparative claim needs head-to-head data."),
    (r"\bmost effective\b|\bmiracle\b|\bbreakthrough\b|\brevolutionary\b", "Overstated efficacy language."),
]

RISK_WORDS = re.compile(r"\b(risk|side effects?|adverse|warning|serious|may cause|contraindicat\w*|infection|death|allerg\w*|stop taking|tell your doctor)\b", re.I)
BENEFIT_WORDS = re.compile(r"(?<!-)\b(improve[sd]?|reduce[sd]?|help(s|ed)?|effective|clear(er|ed)?|relie(f|ve[sd]?)|control(s|led)?|works?)\b", re.I)
QUALIFIER = re.compile(r"\b(stud(y|ies)|trials?)\b", re.I)  # any study reference qualifies the number


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", text) if s.strip()]


def _norm(text: str) -> str:
    return re.sub(r"[^a-z0-9%]+", " ", text.lower()).strip()


def _quote_in_label(quote: str, label_text: str) -> bool:
    """Every fragment of the quote (split on ellipses, as reviewers quote) must be verbatim in the label."""
    fragments = [_norm(f) for f in re.split(r"\.\.\.|…", quote)]
    fragments = [f for f in fragments if len(f.split()) >= 3]
    return bool(fragments) and all(f[:120] in label_text for f in fragments)


def rule_flags(content: str, claims: list[dict], label: dict) -> list[dict]:
    flags = []
    body = re.split(r"(?im)^#+\s*important safety information", content)[0]  # ISI itself may say "serious"

    for s in _sentences(body):
        for pattern, why in BANNED:
            m = re.search(pattern, s, re.I)
            if m:
                flags.append({"excerpt": s, "rule": "overstatement", "severity": "high", "suggestion": why,
                              "source": "rule", "match": m.group(0)})
        if "%" in s and BENEFIT_WORDS.search(s) and not QUALIFIER.search(s):
            flags.append({"excerpt": s, "rule": "overstatement", "severity": "medium", "source": "rule",
                          "suggestion": "Qualify efficacy numbers with 'in clinical studies' and the study reference."})

    if not re.search(r"important safety information", content, re.I):
        flags.append({"excerpt": "", "rule": "missing_isi", "severity": "high", "source": "rule",
                      "suggestion": "Add the Important Safety Information section from the label."})
    if label.get("boxed_warning") and "WARNING" not in content:
        flags.append({"excerpt": "", "rule": "missing_isi", "severity": "high", "source": "rule",
                      "suggestion": "The label has a boxed warning; it must appear, prominently, in the ISI."})

    risk = sum(bool(RISK_WORDS.search(s)) for s in _sentences(content))
    benefit = sum(bool(BENEFIT_WORDS.search(s)) for s in _sentences(body))
    if benefit and risk / benefit < 0.5:
        flags.append({"excerpt": "", "rule": "fair_balance", "severity": "medium", "source": "rule",
                      "suggestion": f"{benefit} benefit statements vs {risk} risk statements; bring risk information "
                                    "closer in weight and prominence."})

    label_text = _norm(" ".join(v for v in label.values() if v))
    for c in claims:
        if not _quote_in_label(c.get("label_quote", ""), label_text):
            flags.append({"excerpt": c.get("text", ""), "rule": "unsupported_claim", "severity": "high",
                          "source": "rule", "suggestion": "Claim is not traceable to the label text; link it to an "
                                                          "approved reference or remove it (blocked until fixed)."})
    return flags


REVIEW_SYSTEM = (
    "You are an experienced US pharma MLR (medical, legal, regulatory) reviewer applying FDA/OPDP standards. "
    "Review the draft against the FDA label. Flag: claims not supported by the label, implied off-label uses, "
    "populations or doses, fair-balance problems (risk information less prominent than benefits), overstated "
    "efficacy, and a misleading overall impression (headline vs body). Quote the exact excerpt and give a concrete "
    "compliant rewrite as the suggestion. Do not flag things that are fine."
)


async def review(content: str, claims: list[dict], label: dict, brand: str) -> dict:
    flags = rule_flags(content, claims, label)
    label_text = "\n\n".join(f"[{k}]\n{v}" for k, v in label.items() if v)
    try:
        ai = await llm.smart(REVIEW_SYSTEM, f"Brand: {brand}\n\nFDA LABEL:\n{label_text}\n\nDRAFT:\n{content}", ClaimReview,
                             effort=settings.draft_effort)
        flags += [{**f.model_dump(), "source": "ai"} for f in ai.flags]
    except Exception as exc:
        flags.append({"excerpt": "", "rule": "other", "severity": "low", "source": "system",
                      "suggestion": f"AI review unavailable ({exc}); rule checks only."})
    score = min(100, sum(SEVERITY_WEIGHT[f["severity"]] for f in flags))
    blocked = any(f["rule"] == "unsupported_claim" and f["source"] == "rule" for f in flags)
    return {
        "risk_score": score,
        "risk_level": "high" if score >= 50 else "medium" if score >= 20 else "low",
        "blocked": blocked,
        "fast_track": score < 20 and not blocked,
        "flags": flags,
    }
