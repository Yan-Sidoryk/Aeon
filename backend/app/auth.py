"""Accounts: Supabase Auth when configured, the anonymous X-Session-Id header otherwise (demo / local).

The browser signs in anonymously on its first visit and sends its Supabase access token as a Bearer token (SSE
streams, which can't send headers, pass it as ?access_token=). At the save gate the same user adds an email, so
the account and everything in it carries over."""

import hashlib
import time

import httpx
from fastapi import Depends, Header, HTTPException, Query
from sqlmodel import Session, select

from app.config import settings
from app.db import get_session
from app.models import Company, Competitor, Draft, Org, Product, Scan

_cache: dict[str, tuple[float, dict]] = {}
CACHE_SECONDS = 60


async def verify_token(token: str) -> dict:
    """The Supabase user behind an access token ({id, email, is_anonymous, ...}); 401 if invalid."""
    key = hashlib.sha256(token.encode()).hexdigest()
    hit = _cache.get(key)
    if hit and hit[0] > time.monotonic():
        return hit[1]
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(f"{settings.supabase_url}/auth/v1/user",
                        headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {token}"})
    if r.status_code != 200:
        raise HTTPException(401, "Sign-in expired. Reload the page.")
    user = r.json()
    _cache[key] = (time.monotonic() + CACHE_SECONDS, user)
    return user


def _org_for_user(session: Session, user: dict, session_id: str | None) -> Org:
    org = session.exec(select(Org).where(Org.user_id == user["id"])).first()
    if org and (not user.get("email") or org.email == user["email"]):
        return org  # the common case: no write per request
    if not org and session_id:  # adopt work done before sign-in on this browser
        org = session.exec(select(Org).where(Org.session_id == session_id, Org.user_id == None)).first()  # noqa: E711
    org = org or Org()
    org.user_id = user["id"]
    if user.get("email"):
        org.email = user["email"]
    session.add(org)
    session.commit()
    session.refresh(org)
    return org


def _org_for_session(session: Session, session_id: str) -> Org:
    org = session.exec(select(Org).where(Org.session_id == session_id)).first()
    if not org:
        org = Org(session_id=session_id)
        session.add(org)
        session.commit()
        session.refresh(org)
    return org


async def current_org(
    authorization: str | None = Header(None),
    x_session_id: str | None = Header(None, description="Anonymous browser session (demo / local, no Supabase)"),
    access_token: str | None = Query(None, include_in_schema=False),  # SSE can't send headers
    session: Session = Depends(get_session),
) -> Org:
    token = (authorization or "").removeprefix("Bearer ").strip() or access_token
    if settings.auth_enabled:
        if not token:
            raise HTTPException(401, "Sign in to continue.")
        return _org_for_user(session, await verify_token(token), x_session_id)
    if not x_session_id:
        raise HTTPException(401, "Missing X-Session-Id header.")
    return _org_for_session(session, x_session_id)


# ---- Ownership ------------------------------------------------------------------
# Ids are sequential, so every non-public endpoint checks that the row belongs to the caller. Reports are the
# exception: their id is a random UUID and the link is meant to be shared.

def _get(session: Session, model, id_):
    obj = session.get(model, id_)
    if obj is None:
        raise HTTPException(404, f"{model.__name__} {id_} not found")
    return obj


def owned_company(session: Session, company_id: int, org: Org) -> Company:
    company = _get(session, Company, company_id)
    if company.org_id != org.id:
        raise HTTPException(404, f"Company {company_id} not found")
    return company


def owned_product(session: Session, product_id: int, org: Org) -> Product:
    product = _get(session, Product, product_id)
    owned_company(session, product.company_id, org)
    return product


def owned_scan(session: Session, scan_id: int, org: Org) -> Scan:
    scan = _get(session, Scan, scan_id)
    owned_product(session, scan.product_id, org)
    return scan


def owned_competitor(session: Session, competitor_id: int, org: Org) -> Competitor:
    competitor = _get(session, Competitor, competitor_id)
    owned_product(session, competitor.product_id, org)
    return competitor


def owned_draft(session: Session, draft_id: int, org: Org) -> Draft:
    draft = _get(session, Draft, draft_id)
    if draft.product_id is not None:
        owned_product(session, draft.product_id, org)
    return draft
