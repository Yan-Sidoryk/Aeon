"""Website reading via Firecrawl: map the site (fast URL list), rank pages likely to list
products, scrape those in parallel, then follow linked brand sites. Falls back to a
plain-HTTP homepage fetch when no Firecrawl key is set."""

import asyncio
import re
from collections.abc import Awaitable, Callable
from urllib.parse import urlparse

import httpx

from app.config import settings

FIRECRAWL = "https://api.firecrawl.dev/v2"
INTERNAL_PAGES = 10
BRAND_SITES = 6

GOOD = ["product", "medicine", "portfolio", "pipeline", "brand", "treatment", "therap", "prescrib", "our-science",
        "what-we-do", "patients", "otc", "consumer"]
BAD = ["investor", "career", "job", "news", "press", "privacy", "cookie", "terms", "legal", "contact", "stories",
       "event", "sitemap", "login", "esg", "sustainab", "governance", "supplier", "grant", ".pdf", "?"]
NOT_BRAND_SITES = ["youtube", "linkedin", "twitter", "x.com", "facebook", "instagram", "google", "apple.com",
                   "sec.gov", "fda.gov", "clinicaltrials", "nasdaq", "nyse", "onetrust", "vimeo", "tiktok",
                   "glassdoor", "wikipedia", "prnewswire", "businesswire", "cookiepedia"]

Progress = Callable[[int], Awaitable[None]] | None


def normalize_url(url: str) -> str:
    url = url.strip()
    if not re.match(r"^https?://", url):
        url = "https://" + url
    return url.rstrip("/")


def domain_of(url: str) -> str:
    return re.sub(r"^https?://(www\.)?", "", normalize_url(url)).split("/")[0].lower()


def score_page(link: dict) -> int:
    url = link["url"].lower()
    text = f"{url} {link.get('title') or ''} {link.get('description') or ''}".lower()
    if any(b in url for b in BAD):
        return -1
    return sum(g in text for g in GOOD) * 2 + (urlparse(url).path.count("/") <= 2)


def brand_site_links(pages: list[dict], home_domain: str) -> list[str]:
    """External sites linked from the corporate pages that look like product/brand sites."""
    seen, out = set(), []
    for p in pages:
        for link in p.get("links", []):
            d = domain_of(link)
            stem = home_domain.split(".")[0]  # skip country sites like incyte.it / incytebiosciences.uk
            if stem in d or d in seen or any(n in d for n in NOT_BRAND_SITES):
                continue
            seen.add(d)
            out.append(f"https://{d}")
    return out[:BRAND_SITES]


async def crawl(url: str, on_progress: Progress = None) -> list[dict]:
    """Returns [{url, title, markdown, links}] for the homepage, top product pages and brand sites.

    Uses batch scrape so one onboarding costs ~6-10 Firecrawl requests (free plans allow ~20/min)."""
    url = normalize_url(url)
    if not settings.firecrawl_api_key:
        return await _fallback(url)
    headers = {"Authorization": f"Bearer {settings.firecrawl_api_key}"}
    async with httpx.AsyncClient(timeout=60, headers=headers) as c:
        r = await _request(c, "POST", f"{FIRECRAWL}/map", json={"url": url, "limit": 500})
        links = [l for l in r.json().get("links", []) if normalize_url(l["url"]) != url]
        ranked = sorted((l for l in links if score_page(l) > 0), key=score_page, reverse=True)[:INTERNAL_PAGES]
        pages = await _batch(c, [url] + [l["url"] for l in ranked], on_progress, done=0)
        brand_urls = brand_site_links(pages, domain_of(url))
        if brand_urls:
            pages += await _batch(c, brand_urls, on_progress, done=len(pages))
    return pages


async def _request(c: httpx.AsyncClient, method: str, url: str, **kw) -> httpx.Response:
    for attempt in range(4):
        r = await c.request(method, url, **kw)
        if r.status_code != 429:
            r.raise_for_status()
            return r
        await asyncio.sleep(5 * (attempt + 1))  # rate limited: back off and retry
    r.raise_for_status()
    return r


async def _batch(c: httpx.AsyncClient, urls: list[str], on_progress: Progress, done: int,
                 timeout_s: int = 14) -> list[dict]:
    """Waits at most timeout_s, then keeps whatever pages are done (slow pages aren't worth the wait)."""
    body = {"urls": urls, "formats": ["markdown", "links"], "onlyMainContent": True, "ignoreInvalidURLs": True}
    job = (await _request(c, "POST", f"{FIRECRAWL}/batch/scrape", json=body)).json()["id"]
    data: list[dict] = []
    for _ in range(timeout_s // 2):
        await asyncio.sleep(2)
        s = (await _request(c, "GET", f"{FIRECRAWL}/batch/scrape/{job}")).json()
        data = s.get("data") or data
        if on_progress:
            await on_progress(done + len(data))
        if s.get("status") in ("completed", "failed", "cancelled"):
            break
        if len(data) >= 0.8 * len(urls):  # don't wait on the slowest pages
            break
    return [
        {"url": d.get("metadata", {}).get("sourceURL") or d.get("metadata", {}).get("url", ""),
         "title": d.get("metadata", {}).get("title", ""), "markdown": d["markdown"], "links": d.get("links", [])}
        for d in data if d.get("markdown")
    ]


async def _fallback(url: str) -> list[dict]:
    async with httpx.AsyncClient(timeout=20, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"}) as c:
        r = await c.get(url)
    html = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", r.text)
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
    return [{"url": url, "title": "", "markdown": text, "links": []}]


def pages_as_context(pages: list[dict], per_page: int = 4000, total: int = 60000) -> str:
    out, size = [], 0
    for p in pages:
        chunk = f"## {p['url']}\n{p['markdown'][:per_page]}\n"
        if size + len(chunk) > total:
            break
        out.append(chunk)
        size += len(chunk)
    return "\n".join(out)
