from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import httpx


@dataclass
class EngineAnswer:
    text: str
    citations: list[dict] = field(default_factory=list)  # [{"url": ..., "title": ...}]


class Engine(ABC):
    name: str  # stable id used in the API and DB
    label: str  # display name for the grid

    @abstractmethod
    def enabled(self) -> bool: ...

    @abstractmethod
    async def ask(self, prompt: str) -> EngineAnswer: ...


def http() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=10.0))


def dedupe_citations(citations: list[dict]) -> list[dict]:
    seen, out = set(), []
    for c in citations:
        url = c.get("url")
        if url and url not in seen:
            seen.add(url)
            out.append({"url": url, "title": c.get("title") or ""})
    return out
