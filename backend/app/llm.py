"""Thin wrapper over the Anthropic SDK for structured (Pydantic) outputs."""

from typing import TypeVar

import anthropic
from pydantic import BaseModel, ValidationError

from app.config import settings

T = TypeVar("T", bound=BaseModel)

client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key or None, max_retries=3)


class LLMError(RuntimeError):
    pass


async def parse(model: str, system: str, user: str, schema: type[T], max_tokens: int = 16000,
                effort: str | None = None) -> T:
    extra = {"output_config": {"effort": effort}} if effort else {}
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
    if response.stop_reason == "refusal":
        raise LLMError("model declined the request")
    if response.parsed_output is None:
        raise LLMError(f"no structured output (stop_reason={response.stop_reason})")
    return response.parsed_output


def fast(system: str, user: str, schema: type[T], max_tokens: int = 8000):
    return parse(settings.model_fast, system, user, schema, max_tokens)


def smart(system: str, user: str, schema: type[T], max_tokens: int = 16000, effort: str | None = None):
    return parse(settings.model_smart, system, user, schema, max_tokens, effort)
