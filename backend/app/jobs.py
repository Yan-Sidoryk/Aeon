"""Durable background jobs.

Jobs and their progress events live in the database (Supabase Postgres in production), so nothing is lost on a
restart: the worker re-queues jobs that were running and runs them again, and progress streams (SSE) read the
event log from the database. Handlers must be idempotent: a retried job starts from scratch.

A handler gets a JobContext with the same emit/finish interface the services always used."""

import asyncio
import json
import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, delete, select

from app.config import settings
from app.db import engine
from app.models import Job, JobEvent

log = logging.getLogger("aeon.jobs")

MAX_ATTEMPTS = 3
TERMINAL = ("done", "failed")

Handler = Callable[["JobContext", dict], Awaitable[None]]
_handlers: dict[str, Handler] = {}
_tasks: set[asyncio.Task] = set()
# The worker's loop and wake-up event. enqueue() runs in request threads, so it signals thread-safely.
_worker: dict[str, Any] = {"loop": None, "wake": None}


def handler(kind: str) -> Callable[[Handler], Handler]:
    """Register the coroutine that runs jobs of this kind."""
    def register(fn: Handler) -> Handler:
        _handlers[kind] = fn
        return fn
    return register


def _now() -> datetime:
    return datetime.now(timezone.utc)


class JobContext:
    def __init__(self, job_id: str):
        self.id = job_id
        self.done = False

    def emit(self, event: str, data: Any) -> None:
        with Session(engine) as s:
            s.add(JobEvent(job_id=self.id, event=event, data=_jsonable(data)))
            s.commit()

    def finish(self, event: str = "done", data: Any = None) -> None:
        """Last event of the job: `done` (with its result) or `error` ({message})."""
        payload = _jsonable(data or {})
        with Session(engine) as s:
            s.add(JobEvent(job_id=self.id, event=event, data=payload))
            job = s.get(Job, self.id)
            job.status = "failed" if event == "error" else "done"
            job.result, job.updated_at = payload, _now()
            job.error = payload.get("message") if event == "error" else None
            s.add(job)
            s.commit()
        self.done = True


def _jsonable(data: Any) -> Any:
    return json.loads(json.dumps(data, default=str))


def enqueue(kind: str, params: dict, org_id: int | None = None, job_id: str | None = None) -> str:
    """Queue a job; returns its id. Re-queuing a finished job with the same id runs it again from scratch.
    Two requests racing to create the same job id (a double click, React StrictMode) both get that one job."""
    try:
        return _enqueue(kind, params, org_id, job_id)
    except IntegrityError:
        if job_id is None:
            raise
        return job_id  # the other request created it first: join it


def _enqueue(kind: str, params: dict, org_id: int | None, job_id: str | None) -> str:
    with Session(engine) as s:
        job = s.get(Job, job_id) if job_id else None
        if job and job.status not in TERMINAL:
            return job.id  # already queued or running: callers join it
        if job:
            s.exec(delete(JobEvent).where(JobEvent.job_id == job.id))
            job.status, job.params, job.result, job.error, job.attempts = "queued", params, {}, None, 0
        else:
            job = Job(kind=kind, params=params, org_id=org_id, **({"id": job_id} if job_id else {}))
        job.updated_at = _now()
        s.add(job)
        s.commit()
        job_id = job.id
    loop, wake = _worker["loop"], _worker["wake"]
    if loop is not None and wake is not None and not loop.is_closed():
        loop.call_soon_threadsafe(wake.set)
    return job_id


def get_job(job_id: str) -> Job | None:
    with Session(engine) as s:
        return s.get(Job, job_id)


def _claim() -> Job | None:
    with Session(engine) as s:
        job = s.exec(select(Job).where(Job.status == "queued").order_by(Job.created_at)
                     .limit(1).with_for_update(skip_locked=True)).first()
        if not job:
            return None
        job.status, job.attempts, job.updated_at = "running", job.attempts + 1, _now()
        s.add(job)
        s.commit()
        s.refresh(job)
        s.expunge(job)
        return job


async def _run(job: Job) -> None:
    ctx = JobContext(job.id)
    if job.attempts > 1:  # a retry after a restart: start the visible log over
        with Session(engine) as s:
            s.exec(delete(JobEvent).where(JobEvent.job_id == job.id))
            s.commit()
    try:
        fn = _handlers.get(job.kind)
        if fn is None:
            raise RuntimeError(f"no handler for job kind '{job.kind}'")
        from app.observability import job_trace

        with job_trace(job.kind, job.id, job.org_id, job.params):
            await fn(ctx, job.params)
        if not ctx.done:
            ctx.finish("done", {})
    except Exception as exc:  # a failing job must not take the worker down
        log.exception("job %s (%s) failed", job.id, job.kind)
        if not ctx.done:
            ctx.finish("error", {"message": str(exc)[:500]})


def resume_interrupted() -> int:
    """Jobs left 'running' by a crash or restart go back to the queue (up to MAX_ATTEMPTS)."""
    with Session(engine) as s:
        stuck = s.exec(select(Job).where(Job.status == "running")).all()
        for job in stuck:
            if job.attempts >= MAX_ATTEMPTS:
                job.status, job.error = "failed", "gave up after repeated restarts"
                s.add(JobEvent(job_id=job.id, event="error", data={"message": job.error}))
            else:
                job.status = "queued"
            job.updated_at = _now()
            s.add(job)
        s.commit()
        return len(stuck)


async def worker() -> None:
    """Runs queued jobs, a few at a time. Started once in the app lifespan."""
    wake = asyncio.Event()
    _worker.update(loop=asyncio.get_running_loop(), wake=wake)
    resumed = resume_interrupted()
    if resumed:
        log.info("re-queued %d interrupted job(s)", resumed)
    slots = asyncio.Semaphore(settings.job_concurrency)
    while True:
        await slots.acquire()
        job = await asyncio.to_thread(_claim)
        if job is None:
            slots.release()
            wake.clear()
            try:
                await asyncio.wait_for(wake.wait(), timeout=2)
            except TimeoutError:
                pass
            continue
        task = asyncio.create_task(_run(job))
        _tasks.add(task)
        task.add_done_callback(lambda t: (_tasks.discard(t), slots.release()))


async def stream(job_id: str, poll: float = 0.4) -> AsyncIterator[dict]:
    """SSE events for a job, from the start of its log. Ends after the terminal event."""
    last = 0
    while True:
        with Session(engine) as s:
            rows = s.exec(select(JobEvent).where(JobEvent.job_id == job_id, JobEvent.id > last)
                          .order_by(JobEvent.id)).all()
            job = s.get(Job, job_id)
            status = job.status if job else "failed"
        for row in rows:
            last = row.id
            yield {"event": row.event, "data": json.dumps(row.data, default=str)}
            if row.event in ("done", "error"):
                return
        if status in TERMINAL and not rows:
            return
        await asyncio.sleep(poll)


class LocalJob:
    """In-memory stand-in for scripts and tests: same emit/finish interface, events kept in a list."""

    def __init__(self, job_id: str = "local"):
        self.id, self.events, self.done = job_id, [], False

    def emit(self, event: str, data: Any) -> None:
        self.events.append({"event": event, "data": _jsonable(data)})

    def finish(self, event: str = "done", data: Any = None) -> None:
        self.emit(event, data or {})
        self.done = True
