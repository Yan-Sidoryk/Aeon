"""Durable background jobs.

Jobs and their progress events live in the database (Supabase Postgres in production), so nothing is lost on a
restart: the worker re-queues jobs that were running and runs them again, and progress streams (SSE) read the
event log from the database. Handlers must be idempotent: a retried job starts from scratch.

On serverless hosts (Vercel) nothing outlives a request, so there is no worker: the request that streams a job's
progress runs it (settings.inline_jobs). A running job updates its heartbeat; if the request running it is cut off,
the next stream of that job picks it up again, and the old run stops at its next event.

A handler gets a JobContext with the same emit/finish interface the services always used."""

import asyncio
import contextlib
import json
import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, delete, select, update

from app.config import settings
from app.db import engine
from app.models import Job, JobEvent

log = logging.getLogger("aeon.jobs")

MAX_ATTEMPTS = 3
TERMINAL = ("done", "failed")
HEARTBEAT_SECONDS = 15
STALE_SECONDS = 60  # a running job without a heartbeat for this long was cut off (serverless timeout, crash)

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


class Superseded(Exception):
    """Another run of this job took over (this one was presumed dead): stop without writing anything."""


class JobContext:
    def __init__(self, job_id: str, attempt: int | None = None):
        self.id = job_id
        self.attempt = attempt  # set when run from the queue: the run that owns the job
        self.done = False

    def _check_owner(self, s: Session) -> None:
        if self.attempt is not None:
            job = s.get(Job, self.id)
            if job is None or job.attempts != self.attempt or job.status != "running":
                raise Superseded(self.id)

    def emit(self, event: str, data: Any) -> None:
        with Session(engine) as s:
            self._check_owner(s)
            s.add(JobEvent(job_id=self.id, event=event, data=_jsonable(data)))
            s.commit()

    def finish(self, event: str = "done", data: Any = None) -> None:
        """Last event of the job: `done` (with its result) or `error` ({message})."""
        payload = _jsonable(data or {})
        with Session(engine) as s:
            self._check_owner(s)
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
    if loop is not None and wake is not None and not loop.is_closed():  # no worker when jobs run inline
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


def _aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)  # SQLite drops the timezone


def _claimable(job: Job) -> bool:
    return job.status == "queued" or (
        job.status == "running" and _now() - _aware(job.updated_at) > timedelta(seconds=STALE_SECONDS))


def _claim_job(job_id: str) -> Job | None:
    """Claim one job to run in this request: queued, or running without a heartbeat (its run was cut off)."""
    with Session(engine) as s:
        job = s.exec(select(Job).where(Job.id == job_id).with_for_update(skip_locked=True)).first()
        if job is None or not _claimable(job):
            return None
        if job.attempts >= MAX_ATTEMPTS:
            job.status, job.error, job.updated_at = "failed", "gave up after repeated interruptions", _now()
            s.add(JobEvent(job_id=job.id, event="error", data={"message": job.error}))
            s.add(job)
            s.commit()
            return None
        job.status, job.attempts, job.updated_at = "running", job.attempts + 1, _now()
        s.add(job)
        s.commit()
        s.refresh(job)
        s.expunge(job)
        return job


def _touch(job_id: str, attempt: int) -> None:
    with Session(engine) as s:
        s.exec(update(Job).where(Job.id == job_id, Job.attempts == attempt, Job.status == "running")
               .values(updated_at=_now()))
        s.commit()


async def _heartbeat(job_id: str, attempt: int) -> None:
    while True:
        await asyncio.sleep(HEARTBEAT_SECONDS)
        await asyncio.to_thread(_touch, job_id, attempt)


def _start(job: Job) -> asyncio.Task:
    task = asyncio.create_task(_run(job))
    _tasks.add(task)
    task.add_done_callback(_tasks.discard)
    return task


async def run_inline(job_id: str) -> None:
    """Run a queued job in this request and wait for it (serverless: e.g. the weekly cron)."""
    if job := await asyncio.to_thread(_claim_job, job_id):
        await _start(job)


async def _run(job: Job) -> None:
    ctx = JobContext(job.id, attempt=job.attempts)
    if job.attempts > 1:  # a retry after a restart: start the visible log over
        with Session(engine) as s:
            s.exec(delete(JobEvent).where(JobEvent.job_id == job.id))
            s.commit()
    beat = asyncio.create_task(_heartbeat(job.id, job.attempts))
    try:
        fn = _handlers.get(job.kind)
        if fn is None:
            raise RuntimeError(f"no handler for job kind '{job.kind}'")
        from app.observability import job_trace

        with job_trace(job.kind, job.id, job.org_id, job.params):
            await fn(ctx, job.params)
        if not ctx.done:
            ctx.finish("done", {})
    except Superseded:
        log.warning("job %s (%s): another run took over, stopping this one", job.id, job.kind)
    except Exception as exc:  # a failing job must not take the worker down
        log.exception("job %s (%s) failed", job.id, job.kind)
        if not ctx.done:
            with contextlib.suppress(Superseded):
                ctx.finish("error", {"message": str(exc)[:500]})
    finally:
        beat.cancel()
        if settings.inline_jobs:
            from app.observability import flush

            await asyncio.to_thread(flush)  # the host may freeze this process once the request ends


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
        _start(job).add_done_callback(lambda _: slots.release())


async def stream(job_id: str, poll: float = 0.4) -> AsyncIterator[dict]:
    """SSE events for a job, from the start of its log. Ends after the terminal event.
    With inline jobs, the stream also runs the job when nobody else is (see the module docstring)."""
    last, runner = 0, None
    while True:
        with Session(engine) as s:
            rows = s.exec(select(JobEvent).where(JobEvent.job_id == job_id, JobEvent.id > last)
                          .order_by(JobEvent.id)).all()
            job = s.get(Job, job_id)
            status = job.status if job else "failed"
            claim = settings.inline_jobs and runner is None and job is not None and _claimable(job)
        if claim and (claimed := await asyncio.to_thread(_claim_job, job_id)):
            runner = _start(claimed)
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
