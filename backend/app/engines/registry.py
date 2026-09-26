from app.engines.base import Engine
from app.engines.claude import ClaudeEngine
from app.engines.google import GoogleAIMode, GoogleAIOverviews

ENGINES: list[Engine] = [ClaudeEngine(), GoogleAIOverviews(), GoogleAIMode()]

# On the roadmap through DataForSEO's LLM endpoints (no new vendor); shown greyed out as "coming soon".
COMING_SOON = [("chatgpt", "ChatGPT"), ("gemini", "Gemini"), ("perplexity", "Perplexity")]


def enabled_engines() -> list[Engine]:
    return [e for e in ENGINES if e.enabled()]


def engine_status() -> list[dict]:
    live = [{"name": e.name, "label": e.label, "enabled": e.enabled(), "coming_soon": False, "samples": e.samples}
            for e in ENGINES]
    soon = [{"name": n, "label": label, "enabled": False, "coming_soon": True, "samples": 0} for n, label in COMING_SOON]
    return live + soon
