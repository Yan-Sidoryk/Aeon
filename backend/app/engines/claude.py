from app.config import settings
from app.engines.base import Engine, EngineAnswer, dedupe_citations
from app.llm import client

WEB_SEARCH = {"type": "web_search_20260209", "name": "web_search", "max_uses": 3}
# Consumer assistants search the web for health questions; without this, low-effort answers to general
# questions skip search and return no citations (1 of 13 unbranded answers searched in testing).
SYSTEM = "You are a helpful assistant. For health and treatment questions, search the web for current information " \
         "before answering."


class ClaudeEngine(Engine):
    name = "claude"
    label = "Claude"

    def enabled(self) -> bool:
        return bool(settings.anthropic_api_key)

    async def ask(self, prompt: str) -> EngineAnswer:
        messages = [{"role": "user", "content": prompt}]
        text_parts: list[str] = []
        citations: list[dict] = []
        for _ in range(4):  # resume server-tool turns that come back as pause_turn
            resp = await client.messages.create(
                model=settings.model_engine_claude,
                max_tokens=16000,
                system=SYSTEM,
                tools=[WEB_SEARCH],
                messages=messages,
                output_config={"effort": settings.engine_effort},
            )
            for block in resp.content:
                if block.type == "text":
                    text_parts.append(block.text)
                    for c in block.citations or []:
                        if getattr(c, "url", None):
                            citations.append({"url": c.url, "title": getattr(c, "title", "")})
                elif block.type == "web_search_tool_result" and isinstance(block.content, list):
                    citations += [{"url": r.url, "title": r.title} for r in block.content]
            if resp.stop_reason != "pause_turn":
                break
            messages.append({"role": "assistant", "content": resp.content})
        return EngineAnswer(text="".join(text_parts).strip(), citations=dedupe_citations(citations))
