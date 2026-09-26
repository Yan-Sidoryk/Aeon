"""AI pre-MLR review: deterministic US (FDA/OPDP) rules plus an LLM claim-matching pass.

Deterministic rules run first and never depend on the model, so reviewers can trust
that the hard checks (ISI present, boxed warning, banned language) always fire."""

import re

from app import llm
from app.config import settings
from app.schemas import ClaimReview

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
    "Review the draft against the FDA label. Flag: claims not supported by the label (unsupported_claim), implied "
    "off-label uses, populations or doses (off_label), fair-balance problems where risk information is less "
    "prominent than benefits (fair_balance), overstated efficacy or a misleading overall impression (overstatement), "
    "comparisons with other drugs that lack head-to-head data (unsupported_comparison), and a missing or incomplete "
    "Important Safety Information section (missing_isi). Quote the exact excerpt and give a concrete compliant "
    "rewrite as the suggestion. Use severity low for style nits. Do not flag things that are fine."
)

# The pre-MLR checklist. A check fails on any high or medium flag of its rules; low flags are notes.
CHECKS = [
    ("claims_traced", "Every claim traced to the label", {"unsupported_claim"}),
    ("on_label", "On-label only: indication, population, dose", {"off_label"}),
    ("no_overstatement", "No overstatement (safe, cure, superlatives, unqualified numbers)", {"overstatement"}),
    ("fair_balance", "Risk information as prominent as benefits", {"fair_balance"}),
    ("isi", "Important Safety Information present, boxed warning first", {"missing_isi"}),
    ("comparisons", "No comparison without head-to-head data", {"unsupported_comparison"}),
]


def checklist(flags: list[dict]) -> dict:
    """{status, blocked, checks: [{id, label, passed, detail}], flags}. status: ready | needs_changes | blocked."""
    checks = []
    for cid, label, rules in CHECKS:
        failing = [f for f in flags if f["rule"] in rules and f["severity"] in ("high", "medium")]
        checks.append({"id": cid, "label": label, "passed": not failing,
                       "detail": failing[0]["suggestion"] if failing else ""})
    # An untraceable claim found by the deterministic rule blocks export outright.
    blocked = any(f["rule"] == "unsupported_claim" and f["source"] == "rule" for f in flags)
    status = "blocked" if blocked else "ready" if all(c["passed"] for c in checks) else "needs_changes"
    return {"status": status, "blocked": blocked, "checks": checks, "flags": flags}


async def review(content: str, claims: list[dict], label: dict, brand: str) -> dict:
    flags = rule_flags(content, claims, label)
    label_text = "\n\n".join(f"[{k}]\n{v}" for k, v in label.items() if v)
    try:
        ai = await llm.smart(llm.cached(REVIEW_SYSTEM, f"Brand: {brand}\n\nFDA LABEL:\n{label_text}"),
                             f"DRAFT:\n{content}", ClaimReview, effort=settings.draft_effort)
        flags += [{**f.model_dump(), "source": "ai"} for f in ai.flags]
    except Exception as exc:
        flags.append({"excerpt": "", "rule": "other", "severity": "low", "source": "system",
                      "suggestion": f"AI review unavailable ({exc}); rule checks only."})
    return checklist(flags)
