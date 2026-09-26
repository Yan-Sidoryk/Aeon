"""DataForSEO v3 (US, English): Google AI Overviews and AI Mode for a question, and real questions people ask.

Gotchas (verified live, Sep 2026):
- A failed live call can come back as HTTP 200 with the envelope saying OK: the task's own status_code is e.g.
  40101 "Internal SE Server Error", result is null, and it is still charged. Check the task, retry with backoff.
- AI Overviews often load asynchronously: `load_async_ai_overview` fetches them (the extra charge is refunded when
  the overview wasn't async). Without it they come back as an empty stub.
- An overview item with no markdown and no items means Google showed one but it couldn't be captured."""

import asyncio
import logging
import re
from contextvars import ContextVar

import httpx

from app import spend
from app.config import settings

log = logging.getLogger("aeon.dataforseo")

API = "https://api.dataforseo.com"
US = {"location_code": 2840, "language_code": "en"}
RETRYABLE = {40101, 50000, 50301, 40501}  # internal SE errors / temporary: charged, worth one more try

# Dollars spent in the current task (a scan or agent run); read it to log cost alongside Claude usage.
spent: ContextVar[float] = ContextVar("dataforseo_spent", default=0.0)


class DataForSEOError(RuntimeError):
    pass


async def post(path: str, task: dict, retries: int = 2) -> dict:
    """One live task. Returns tasks[0].result[0], or raises DataForSEOError."""
    last = ""
    for attempt in range(retries + 1):
        async with httpx.AsyncClient(timeout=120, auth=(settings.dataforseo_login, settings.dataforseo_password)) as c:
            r = await c.post(API + path, json=[task])
        r.raise_for_status()
        body = r.json()
        spent.set(spent.get() + float(body.get("cost") or 0))
        spend.add(float(body.get("cost") or 0))
        t = (body.get("tasks") or [{}])[0]
        if t.get("status_code") == 20000 and t.get("result"):
            return t["result"][0]
        last = f"{t.get('status_code')} {t.get('status_message')}"
        if attempt < retries and t.get("status_code") in RETRYABLE:
            await asyncio.sleep(2 * (attempt + 1))
            continue
        break
    raise DataForSEOError(f"DataForSEO {path}: {last}")


def _references(item: dict) -> list[dict]:
    seen, out = set(), []
    for ref in item.get("references") or []:
        url = ref.get("url")
        if url and url not in seen:
            seen.add(url)
            out.append({"url": url, "title": ref.get("title") or ref.get("source") or "", "domain": ref.get("domain") or ""})
    return out


CITE = re.compile(r"\[\[\d+\]\]\([^)]*\)")  # inline "[[3]](https://...)" markers; references carry the sources


def overview(item: dict | None) -> dict:
    """{shown, captured, text, references, position} from an ai_overview item (organic or AI Mode)."""
    if item is None:
        return {"shown": False, "captured": False, "text": "", "references": [], "position": None}
    text = item.get("markdown") or "\n\n".join(
        (sec.get("markdown") or sec.get("text") or "") for sec in item.get("items") or [])
    return {
        "shown": True,
        "captured": bool(text.strip()),
        "text": CITE.sub("", text).strip(),
        "references": _references(item),
        "position": item.get("rank_absolute"),
    }


def _first_item(result: dict, kind: str) -> dict | None:
    return next((i for i in result.get("items") or [] if i.get("type") == kind), None)


async def ai_overview(question: str) -> dict:
    """Google's AI Overview for the question (US desktop), if one is shown."""
    result = await post("/v3/serp/google/organic/live/advanced", {
        "keyword": question[:700], **US, "device": "desktop", "os": "windows", "depth": 10,
        "load_async_ai_overview": True,
    })
    return overview(_first_item(result, "ai_overview"))


async def ai_mode(question: str) -> dict:
    """Google AI Mode's answer to the question."""
    result = await post("/v3/serp/google/ai_mode/live/advanced", {
        "keyword": question[:700], **US, "device": "desktop", "os": "windows"})
    return overview(_first_item(result, "ai_overview"))


OFF_TOPIC = re.compile(r"\b(dog|dogs|cat|cats|canine|feline|pet|pets|horse|chinese people|natural(ly)?|home remed)", re.I)


def people_also_ask_from(result: dict) -> list[str]:
    block = _first_item(result, "people_also_ask")
    questions = [q.get("title", "").strip() for q in (block or {}).get("items") or []]
    return [q for q in dict.fromkeys(questions) if q and not OFF_TOPIC.search(q)]


async def people_also_ask(keyword: str, click_depth: int = 1) -> list[str]:
    """Real questions from Google's "People also ask" box for a condition or treatment query."""
    result = await post("/v3/serp/google/organic/live/advanced", {
        "keyword": keyword, **US, "device": "desktop", "os": "windows", "depth": 10,
        "people_also_ask_click_depth": click_depth})
    return people_also_ask_from(result)


QUESTION_START = "^(what|how|why|when|which|who|can|does|do|is|are|should|will)[ ]"  # "[ ]": a bare trailing space is dropped


async def question_keywords(seed: str, limit: int = 30) -> list[dict]:
    """Question-shaped Google searches containing the seed, by US monthly search volume ({keyword, volume})."""
    result = await post("/v3/dataforseo_labs/google/keyword_suggestions/live", {
        "keyword": seed, **US, "limit": limit, "ignore_synonyms": True,
        "filters": ["keyword", "regex", QUESTION_START],
        "order_by": ["keyword_info.search_volume,desc"]})
    out = []
    for item in result.get("items") or []:
        kw = item.get("keyword") or ""
        if kw and not OFF_TOPIC.search(kw):
            out.append({"keyword": kw, "volume": (item.get("keyword_info") or {}).get("search_volume") or 0})
    return out


async def brand_search_volume(brands: list[str]) -> dict[str, int]:
    """US monthly Google searches for each brand name (to pre-select the hero drug)."""
    if not brands:
        return {}
    result = await post("/v3/dataforseo_labs/google/keyword_overview/live", {
        "keywords": [b.lower() for b in brands][:700], **US})
    volumes = {}
    for item in result.get("items") or []:
        volumes[(item.get("keyword") or "").lower()] = (item.get("keyword_info") or {}).get("search_volume") or 0
    return volumes
