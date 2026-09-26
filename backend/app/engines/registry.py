from app.engines.ai_overviews import AIOverviewsEngine
from app.engines.base import Engine
from app.engines.claude import ClaudeEngine
from app.engines.gemini import GeminiEngine
from app.engines.openai import OpenAIEngine
from app.engines.perplexity import PerplexityEngine

ENGINES: list[Engine] = [OpenAIEngine(), ClaudeEngine(), GeminiEngine(), PerplexityEngine(), AIOverviewsEngine()]


def enabled_engines() -> list[Engine]:
    return [e for e in ENGINES if e.enabled()]


def engine_status() -> list[dict]:
    return [{"name": e.name, "label": e.label, "enabled": e.enabled()} for e in ENGINES]
