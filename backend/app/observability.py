"""Langfuse tracing: one trace per background job, with nested agent steps, tool calls and Claude calls.

Claude calls are captured by the OpenInference Anthropic instrumentor. (Langfuse's docs point at the Traceloop
instrumentor, but in anthropic 1.x it misses messages.parse and the tool runner.) Tools and agents add their own
spans with @observe. Everything is a no-op when the Langfuse keys are missing (tests, demo)."""

import os
from contextlib import contextmanager

import certifi

# python.org builds of macOS Python ship without CA certs: the OTLP exporter would fail TLS and drop spans silently.
os.environ.setdefault("SSL_CERT_FILE", certifi.where())

from langfuse import Langfuse, get_client, observe, propagate_attributes  # noqa: E402

from app.config import settings  # noqa: E402

__all__ = ["init_tracing", "shutdown", "observe", "job_trace", "score", "langfuse"]

_state = {"on": False}


def init_tracing() -> None:
    Langfuse(public_key=settings.langfuse_public_key or None, secret_key=settings.langfuse_secret_key or None,
             base_url=settings.langfuse_host, tracing_enabled=settings.langfuse_enabled,
             environment=settings.environment)
    if settings.langfuse_enabled and not _state["on"]:
        from openinference.instrumentation.anthropic import AnthropicInstrumentor

        AnthropicInstrumentor().instrument()
        _state["on"] = True


def langfuse() -> Langfuse:
    return get_client()


def flush() -> None:
    if settings.langfuse_enabled:
        get_client().flush()


def shutdown() -> None:
    if settings.langfuse_enabled:  # a disabled client's shutdown blocks on threads that never started
        get_client().shutdown()


@contextmanager
def job_trace(kind: str, job_id: str, org_id: int | None, params: dict):
    """Root observation for one background job; everything inside nests under it."""
    client = get_client()
    session = next((f"{k}-{params[k]}" for k in ("product_id", "company_id", "report_id", "scan_id") if k in params), job_id)
    with client.start_as_current_observation(as_type="chain", name=f"job:{kind}", input=params) as span, \
            propagate_attributes(trace_name=f"aeon.{kind}", user_id=str(org_id or "anonymous"), session_id=session,
                                 tags=[kind], metadata={"job_id": job_id}):
        yield span


def score(name: str, passed: bool, comment: str = "") -> None:
    """Pass/fail score on the current trace (Aeon reports checks, not numbers)."""
    if settings.langfuse_enabled:
        get_client().score_current_trace(name=name, value=1.0 if passed else 0.0, data_type="BOOLEAN", comment=comment)
