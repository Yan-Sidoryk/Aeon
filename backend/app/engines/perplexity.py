# Untested until a PERPLEXITY_API_KEY is available. Sonar returns citations natively.
from app.config import settings
from app.engines.base import Engine, EngineAnswer, dedupe_citations, http

MODEL = "sonar"


class PerplexityEngine(Engine):
    name = "perplexity"
    label = "Perplexity"

    def enabled(self) -> bool:
        return bool(settings.perplexity_api_key)

    async def ask(self, prompt: str) -> EngineAnswer:
        async with http() as c:
            r = await c.post(
                "https://api.perplexity.ai/chat/completions",
                headers={"Authorization": f"Bearer {settings.perplexity_api_key}"},
                json={"model": MODEL, "messages": [{"role": "user", "content": prompt}]},
            )
            r.raise_for_status()
            data = r.json()
        text = data["choices"][0]["message"]["content"]
        cites = data.get("search_results") or [{"url": u} for u in data.get("citations", [])]
        return EngineAnswer(text.strip(), dedupe_citations(cites))
