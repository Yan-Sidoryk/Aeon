"""Thin wrapper over the Anthropic SDK for structured (Pydantic) outputs."""

from typing import TypeVar

import anthropic
from pydantic import BaseModel, ValidationError

from app import spend
from app.config import settings

T = TypeVar("T", bound=BaseModel)

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key or None, max_retries=3)


class LLMError(RuntimeError):
    pass


def cached(system: str, document: str) -> list[dict]:
    """System prompt plus a large, repeated document (e.g. an FDA label) marked for prompt caching: calls that
    share it (every label check in a scan) read it from cache at a tenth of the price."""
    return [{"type": "text", "text": system},
            {"type": "text", "text": document, "cache_control": {"type": "ephemeral"}}]


async def parse(model: str, system: str | list[dict], user: str, schema: type[T], max_tokens: int = 16000,
                effort: str | None = None) -> T:
    # Haiku 4.5 rejects the effort parameter; every current Sonnet/Opus model takes it.
    extra = {"output_config": {"effort": effort}} if effort and "haiku" not in model else {}
    try:
        response = await client.messages.parse(
            model=model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_format=schema,
            **extra,
        )
    except ValidationError as exc:  # output cut off at max_tokens -> truncated JSON
        raise LLMError(f"structured output incomplete (likely hit max_tokens={max_tokens})") from exc
    spend.claude(model, response.usage)
    if response.stop_reason == "refusal":
        raise LLMError("model declined the request")
    if response.parsed_output is None:
        raise LLMError(f"no structured output (stop_reason={response.stop_reason})")
    return response.parsed_output


def fast(system: str | list[dict], user: str, schema: type[T], max_tokens: int = 8000):
    return parse(settings.model_fast, system, user, schema, max_tokens)


def smart(system: str | list[dict], user: str, schema: type[T], max_tokens: int = 16000, effort: str | None = None):
    return parse(settings.model_smart, system, user, schema, max_tokens, effort)
