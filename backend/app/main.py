from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import init_db
from app.routers import onboarding, report, scan
from app.services import demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Aeon API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"], allow_headers=["*"])
app.include_router(onboarding.router)
app.include_router(scan.router)
app.include_router(report.router)


@app.get("/api/health")
def health():
    return {"ok": True, "demo_mode": settings.demo_mode and demo.available()}
