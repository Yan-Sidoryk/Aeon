# Untested until an OPENAI_API_KEY is available. Responses API with the web_search tool.
from app.config import settings
from app.engines.base import Engine, EngineAnswer, dedupe_citations, http

MODEL = "gpt-5"


class OpenAIEngine(Engine):
    name = "chatgpt"
    label = "ChatGPT"

    def enabled(self) -> bool:
        return bool(settings.openai_api_key)

    async def ask(self, prompt: str) -> EngineAnswer:
        async with http() as c:
            r = await c.post(
                "https://api.openai.com/v1/responses",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={"model": MODEL, "tools": [{"type": "web_search"}], "input": prompt},
            )
            r.raise_for_status()
            data = r.json()
        text, cites = [], []
        for item in data.get("output", []):
            if item.get("type") != "message":
                continue
            for part in item.get("content", []):
                if part.get("type") == "output_text":
                    text.append(part.get("text", ""))
                    cites += [a for a in part.get("annotations", []) if a.get("type") == "url_citation"]
        return EngineAnswer("".join(text).strip(), dedupe_citations(cites))
