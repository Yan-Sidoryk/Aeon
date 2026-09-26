"""Google AI Overviews and Google AI Mode, fetched through DataForSEO (US, English, desktop)."""

from app.config import settings
from app.engines.base import Engine, EngineAnswer
from app.services import dataforseo


def _answer(result: dict, what: str) -> EngineAnswer:
    if result["shown"] and not result["captured"]:
        raise RuntimeError(f"Google showed an {what} but it couldn't be captured")
    return EngineAnswer(result["text"], result["references"], shown=result["shown"])


class GoogleAIOverviews(Engine):
    name = "google_aio"
    label = "Google AI Overviews"

    def enabled(self) -> bool:
        return settings.dataforseo_enabled

    async def ask(self, prompt: str) -> EngineAnswer:
        return _answer(await dataforseo.ai_overview(prompt), "AI Overview")


class GoogleAIMode(Engine):
    name = "google_ai_mode"
    label = "Google AI Mode"

    def enabled(self) -> bool:
        return settings.dataforseo_enabled

    async def ask(self, prompt: str) -> EngineAnswer:
        return _answer(await dataforseo.ai_mode(prompt), "AI Mode answer")
