"""What a live job costs, measured while it runs: Claude tokens and web searches from each response's usage,
DataForSEO's reported cost, Apify's spend cap. jobs.py stores the total on the job; guard.py adds up the day.

The meter lives in a context variable holding a mutable dict, so tasks a job spawns (asyncio.gather) add to the
same total. Outside a job (scripts, evals) nothing is metered."""

from contextvars import ContextVar
from typing import Any

# $ per million tokens: (input, output). Cache writes cost 1.25x input, cache reads 0.1x (5-minute cache).
PRICES = {
    "claude-opus-5": (5.0, 25.0),
    "claude-sonnet-5": (2.0, 10.0),
    "claude-haiku-4-5": (1.0, 5.0),
}
UNKNOWN = PRICES["claude-opus-5"]  # a model missing above is metered at the most expensive price, never as free
WEB_SEARCH_USD = 0.01  # $10 per 1,000 searches; web fetch costs only its tokens

_meter: ContextVar[dict | None] = ContextVar("spend_meter", default=None)


def start() -> dict:
    """Start metering the current job; returns the running total ({"usd": float})."""
    meter = {"usd": 0.0}
    _meter.set(meter)
    return meter


def add(usd: float) -> None:
    meter = _meter.get()
    if meter is not None:
        meter["usd"] += usd


def claude_cost(model: str, usage: Any) -> float:
    if usage is None:
        return 0.0
    price_in, price_out = next((p for name, p in PRICES.items() if model.startswith(name)), UNKNOWN)
    tokens_in = (getattr(usage, "input_tokens", 0) or 0) \
        + 1.25 * (getattr(usage, "cache_creation_input_tokens", 0) or 0) \
        + 0.1 * (getattr(usage, "cache_read_input_tokens", 0) or 0)
    searches = getattr(getattr(usage, "server_tool_use", None), "web_search_requests", 0) or 0
    return (tokens_in * price_in + (getattr(usage, "output_tokens", 0) or 0) * price_out) / 1e6 + searches * WEB_SEARCH_USD


def claude(model: str, usage: Any) -> None:
    add(claude_cost(model, usage))
