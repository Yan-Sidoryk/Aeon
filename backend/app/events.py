"""In-memory job event log. Late subscribers replay history, so the frontend can
connect to the SSE stream after the job has started (or even finished)."""

import asyncio
import json
from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Job:
    events: list[dict] = field(default_factory=list)
    done: bool = False
    _changed: asyncio.Event = field(default_factory=asyncio.Event)

    def emit(self, event: str, data: Any) -> None:
        self.events.append({"event": event, "data": data})
        self._changed.set()

    def finish(self, event: str = "done", data: Any = None) -> None:
        self.emit(event, data or {})
        self.done = True

    async def stream(self) -> AsyncIterator[dict]:
        i = 0
        while True:
            while i < len(self.events):
                ev = self.events[i]
                i += 1
                yield {"event": ev["event"], "data": json.dumps(ev["data"], default=str)}
            if self.done:
                return
            self._changed.clear()
            await self._changed.wait()


_jobs: dict[str, Job] = {}
_tasks: set[asyncio.Task] = set()


def create_job(job_id: str) -> Job:
    _jobs[job_id] = Job()
    return _jobs[job_id]


def get_job(job_id: str) -> Job | None:
    return _jobs.get(job_id)


def run_in_background(coro) -> None:
    task = asyncio.create_task(coro)
    _tasks.add(task)  # keep a reference so the task isn't garbage-collected
    task.add_done_callback(_tasks.discard)
