"""openFDA drug label client (US labels only). No API key needed at hackathon volumes.

Some labels (often newer biologics) have no harmonized `openfda` block, so field searches on
brand/generic/manufacturer miss them. We also search those with `_missing_:openfda` and read
brand and molecule from `spl_product_data_elements`."""

import asyncio
import re

import httpx

LABEL_URL = "https://api.fda.gov/drug/label.json"
SECTION_LIMIT = 6000  # chars per label section, keeps LLM prompts bounded

SECTIONS = {
    "indications": "indications_and_usage",
    "dosage": "dosage_and_administration",
    "boxed_warning": "boxed_warning",
    "contraindications": "contraindications",
    "warnings": "warnings_and_cautions",
    "adverse_reactions": "adverse_reactions",
}


def _first(record: dict, key: str) -> str:
    val = record.get(key) or []
    return (val[0] if isinstance(val, list) and val else str(val or ""))[:SECTION_LIMIT]


def _names_from_spl(record: dict) -> tuple[str, str]:
    """'NIKTIMVO axatilimab-csfr AXATILIMAB ...' -> ('NIKTIMVO', 'axatilimab-csfr')."""
    tokens = _first(record, "spl_product_data_elements").split()
    brand = []
    for t in tokens:
        if not t.isupper():
            break
        brand.append(t)
    if not brand and tokens:  # "Iclusig ponatinib ..." (brand not upper-cased)
        brand = tokens[:1]
    rest = tokens[len(brand):]
    return " ".join(brand[:3]), (rest[0] if rest else "")


def parse_label(record: dict, manufacturer: str = "") -> dict:
    """Flatten an openFDA label record into what the rest of the app uses."""
    o = record.get("openfda") or {}
    if o.get("brand_name"):
        brand, molecule = o["brand_name"][0], (o.get("generic_name") or [""])[0]
        manufacturer = (o.get("manufacturer_name") or [manufacturer])[0]
        rx = "PRESCRIPTION" in (o.get("product_type") or [""])[0]
    else:
        brand, molecule = _names_from_spl(record)
        rx = "purpose" not in record and "drug facts" not in _first(record, "spl_unclassified_section").lower()
    label = {name: _first(record, key) for name, key in SECTIONS.items()}
    # OTC labels use different section names
    label["indications"] = label["indications"] or _first(record, "purpose")
    label["warnings"] = label["warnings"] or _first(record, "warnings")
    return {
        "brand": brand.title(),
        "molecule": molecule.lower(),
        "manufacturer": manufacturer,
        "tier": "Rx" if rx else "OTC",
        "indexed": bool(o.get("brand_name")),  # False: manufacturer is inferred, not from openFDA
        "set_id": record.get("set_id"),
        "effective_time": record.get("effective_time", ""),
        "label": label,
    }


async def _search(query: str, limit: int = 100) -> list[dict]:
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.get(LABEL_URL, params={"search": query, "limit": limit})
        if r.status_code == 404:  # openFDA returns 404 for "no matches"
            return []
        r.raise_for_status()
        return r.json().get("results", [])


def dedupe_latest(labels: list[dict]) -> list[dict]:
    """One label per brand + molecule, keeping the most recent version."""
    best: dict[tuple, dict] = {}
    for lab in labels:
        if not lab["brand"]:
            continue
        key = (lab["brand"].lower(), lab["molecule"])
        if key not in best or lab["effective_time"] > best[key]["effective_time"]:
            best[key] = lab
    return list(best.values())


def _q(term: str) -> str:
    return term.replace('"', "")


async def labels_by_manufacturer(company: str) -> list[dict]:
    indexed, unindexed = await asyncio.gather(
        _search(f'openfda.manufacturer_name:"{_q(company)}"'),
        _search(f'_missing_:openfda AND "{_q(company)}"', limit=50),
    )
    # Unindexed labels matched on full text; the company is named in them (e.g. "Manufactured by").
    labels = [parse_label(r) for r in indexed] + [parse_label(r, manufacturer=company) for r in unindexed]
    return dedupe_latest(labels)


async def label_by_name(name: str) -> dict | None:
    """Label for a brand or molecule name. An exact brand match wins over a molecule match."""
    n = _q(name)
    records = await _search(
        f'openfda.brand_name:"{n}" openfda.generic_name:"{n}" spl_product_data_elements:"{n}"', limit=20)
    labels = dedupe_latest([parse_label(r) for r in records])
    if not labels:
        return None
    key = name.lower()
    # prefer indexed labels: their manufacturer is known, so partner products can be detected
    return max(labels, key=lambda l: (l["brand"].lower() == key, key in l["molecule"], l["indexed"],
                                      l["effective_time"]))
