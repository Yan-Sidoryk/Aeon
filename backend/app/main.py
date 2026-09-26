import asyncio
import contextlib
from contextlib import asynccontextmanager

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import handlers  # noqa: F401  registers the job handlers
from app import jobs
from app.config import settings
from app.db import init_db
from app.observability import init_tracing, shutdown
from app.routers import dashboard, onboarding, report, scan
from app.scheduler import run_due, scheduler
from app.services import demo, sample


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_tracing()
    init_db()
    # Serverless: no background tasks outlive a request; jobs run in their streams, weekly scans via /api/cron/weekly
    tasks = [] if settings.inline_jobs else [asyncio.create_task(jobs.worker()), asyncio.create_task(scheduler())]
    if not settings.demo_mode:  # demo mode replays the recording for every run already
        tasks.append(asyncio.create_task(sample.seed_quietly()))
    yield
    for task in tasks:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task
    shutdown()  # flush traces


MOUNT = "/api/backend"  # on Vercel the API is a service at this path, next to the Next.js frontend


class Unmount:
    """Serve the same /api/... routes whether or not the host strips the service's mount path. Plain ASGI, so SSE
    streams pass straight through."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        path = scope.get("path", "")
        if scope["type"] in ("http", "websocket") and (path == MOUNT or path.startswith(MOUNT + "/")):
            scope = {**scope, "path": path[len(MOUNT):] or "/"}
        await self.app(scope, receive, send)


app = FastAPI(title="Aeon API", version="0.2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(Unmount)
app.include_router(onboarding.router)
app.include_router(scan.router)
app.include_router(report.router)
app.include_router(dashboard.router)


@app.get("/api/cron/weekly", include_in_schema=False)
async def weekly_cron(authorization: str | None = Header(None)):
    """Vercel Cron: start the weekly scans that are due and run them here (no worker on serverless)."""
    if settings.cron_secret and authorization != f"Bearer {settings.cron_secret}":
        raise HTTPException(401, "Not the scheduler")
    started = await asyncio.to_thread(run_due)
    if settings.inline_jobs:
        await asyncio.gather(*(jobs.run_inline(f"scan-{scan_id}") for scan_id in started))
    return {"started": started}


@app.get("/api/health")
def health():
    on = settings.demo_mode and demo.available()
    # demo_domain: the site the recording is of, so the UI can say whose results a replay shows
    return {"ok": True, "demo_mode": on, "auth": settings.auth_enabled, "sample_report_id": sample.report_id(),
            **({"demo_domain": demo.load()["company"]["domain"]} if on else {})}
