# Untested until a GEMINI_API_KEY is available. generateContent with Google Search grounding.
from app.config import settings
from app.engines.base import Engine, EngineAnswer, dedupe_citations, http

MODEL = "gemini-2.5-flash"


class GeminiEngine(Engine):
    name = "gemini"
    label = "Gemini"

    def enabled(self) -> bool:
        return bool(settings.gemini_api_key)

    async def ask(self, prompt: str) -> EngineAnswer:
        async with http() as c:
            r = await c.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent",
                headers={"x-goog-api-key": settings.gemini_api_key},
                json={"contents": [{"parts": [{"text": prompt}]}], "tools": [{"google_search": {}}]},
            )
            r.raise_for_status()
            cand = (r.json().get("candidates") or [{}])[0]
        text = "".join(p.get("text", "") for p in cand.get("content", {}).get("parts", []))
        chunks = cand.get("groundingMetadata", {}).get("groundingChunks", [])
        cites = [{"url": ch["web"].get("uri"), "title": ch["web"].get("title")} for ch in chunks if "web" in ch]
        return EngineAnswer(text.strip(), dedupe_citations(cites))
