# Untested until a SERPAPI_KEY is available. Google AI Overviews via SerpApi.
from app.config import settings
from app.engines.base import Engine, EngineAnswer, dedupe_citations, http

URL = "https://serpapi.com/search.json"


def _blocks_text(blocks: list[dict]) -> str:
    out = []
    for b in blocks:
        if b.get("snippet"):
            out.append(b["snippet"])
        for item in b.get("list", []):
            out.append("- " + (item.get("title", "") + " " + item.get("snippet", "")).strip())
    return "\n".join(out)


class AIOverviewsEngine(Engine):
    name = "ai_overviews"
    label = "Google AI Overviews"

    def enabled(self) -> bool:
        return bool(settings.serpapi_key)

    async def ask(self, prompt: str) -> EngineAnswer:
        key = settings.serpapi_key
        async with http() as c:
            r = await c.get(URL, params={"engine": "google", "q": prompt, "gl": "us", "hl": "en", "api_key": key})
            r.raise_for_status()
            overview = r.json().get("ai_overview") or {}
            if "page_token" in overview:  # the overview is loaded by a second request
                params = {"engine": "google_ai_overview", "page_token": overview["page_token"], "api_key": key}
                r = await c.get(URL, params=params)
                r.raise_for_status()
                overview = r.json().get("ai_overview") or {}
        cites = [{"url": ref.get("link"), "title": ref.get("title")} for ref in overview.get("references", [])]
        return EngineAnswer(_blocks_text(overview.get("text_blocks", [])), dedupe_citations(cites))
