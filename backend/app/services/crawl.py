"""URL helpers for discovery: normalise a website, rank links that likely list products, spot linked brand
sites, and a plain-HTTP homepage fetch. The discovery agent reads pages with Claude's web fetch."""

import re
from collections.abc import Awaitable, Callable
from urllib.parse import urlparse

import httpx

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
    """Homepage text as a single page (plain HTTP). The discovery agent reads further pages with Claude's web fetch."""
    return await _fallback(normalize_url(url))


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
