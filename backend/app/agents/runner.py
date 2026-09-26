"""The agent loop, on the Anthropic SDK's tool runner.

Claude picks the next tool, the runner executes it and feeds the result back, until Claude stops calling tools
or max_iterations is hit. Server tools (web fetch / web search) run on Anthropic's side; a long server-tool turn
can end with stop_reason "pause_turn", which the Python runner doesn't resume, so we restart it with the
history mirrored (the documented pattern)."""

import logging
from collections.abc import Callable
from typing import Any

from app.config import settings
from app.llm import LLMError, client
from app.observability import observe

WEB_FETCH = {"type": "web_fetch_20260209", "name": "web_fetch", "max_uses": 6, "max_content_tokens": 6000}
WEB_SEARCH = {"type": "web_search_20260209", "name": "web_search", "max_uses": 3}

OnServerTool = Callable[[str, dict], None]  # (tool name, input) -> emit a progress step

log = logging.getLogger("aeon.agents")


def _add_usage(total: dict, u) -> None:
    if u is None:
        return
    total["turns"] += 1
    total["input"] += u.input_tokens or 0
    total["output"] += u.output_tokens or 0
    total["cache_read"] += getattr(u, "cache_read_input_tokens", 0) or 0
    total["cache_write"] += getattr(u, "cache_creation_input_tokens", 0) or 0


@observe(as_type="agent", capture_input=False)
async def run_agent(*, system: str, user: Any, tools: list, model: str | None = None, effort: str | None = None,
                    max_iterations: int = 30, max_tokens: int = 16000,
                    on_server_tool: OnServerTool | None = None) -> list[dict]:
    """Runs the loop to the end and returns the full message history."""
    messages: list[dict] = [{"role": "user", "content": user}]
    usage = {"input": 0, "output": 0, "cache_read": 0, "cache_write": 0, "turns": 0}
    try:
        return await _loop(messages, usage, system, tools, model, effort, max_iterations, max_tokens, on_server_tool)
    finally:
        log.info("agent usage %s", usage)


async def _loop(messages, usage, system, tools, model, effort, max_iterations, max_tokens, on_server_tool):
    for _restart in range(5):
        runner = client.beta.messages.tool_runner(
            model=model or settings.model_smart,
            max_tokens=max_tokens,
            system=system,
            tools=tools,
            messages=list(messages),
            max_iterations=max_iterations,
            output_config={"effort": effort or settings.agent_effort},
            cache_control={"type": "ephemeral"},  # each turn resends the history: cache it
        )
        last = None
        async for message in runner:
            last = message
            _add_usage(usage, message.usage)
            messages.append({"role": "assistant", "content": message.content})
            if on_server_tool:
                for block in message.content:
                    if block.type == "server_tool_use":
                        on_server_tool(block.name, dict(block.input or {}))
            response = await runner.generate_tool_call_response()
            if response is not None:
                messages.append(response)
        if last is not None and last.stop_reason == "refusal":
            raise LLMError("Claude declined this request")
        if last is None or last.stop_reason != "pause_turn":
            return messages
    raise LLMError("agent turn still paused after 5 restarts")


def final_text(messages: list[dict]) -> str:
    """Text of the last assistant message."""
    for m in reversed(messages):
        if m["role"] == "assistant":
            return "".join(getattr(b, "text", "") for b in m["content"] if getattr(b, "type", "") == "text").strip()
    return ""
