"""Guardrails on live runs: the website check, visitor limits, sign-in gates and the daily spend cap."""

import asyncio

import pytest
from fastapi import HTTPException
from sqlmodel import Session

from app import guard
from app.auth import Caller
from app.config import settings
from app.db import engine, init_db
from app.models import Job, Org
from app.services import website


@pytest.mark.parametrize("raw", ["asdf", "hello world", "localhost", "http://10.0.0.1", "ftp://acme.com",
                                 "acme", "https://user:pw@acme.com", "acme.com:8080", ""])
def test_not_a_website(raw):
    with pytest.raises(HTTPException) as e:
        website.parse(raw)
    assert e.value.status_code == 422


@pytest.mark.parametrize("raw,host", [("incyte.com", "incyte.com"), ("https://www.Incyte.com/us/", "www.incyte.com"),
                                      ("acme-pharma.co.uk", "acme-pharma.co.uk")])
def test_websites(raw, host):
    assert website.parse(raw)[0] == host


def test_private_address_refused(monkeypatch):
    async def resolve(host):
        return ["127.0.0.1"]

    monkeypatch.setattr(website, "_resolve", resolve)
    with pytest.raises(HTTPException) as e:
        asyncio.run(website.check("sneaky.example.com"))
    assert "public" in e.value.detail


def test_unknown_domain(monkeypatch):
    async def resolve(host):
        return []

    monkeypatch.setattr(website, "_resolve", resolve)
    with pytest.raises(HTTPException) as e:
        asyncio.run(website.check("no-such-pharma-xyz.com"))
    assert "couldn't find" in e.value.detail


@pytest.fixture
def live(monkeypatch):
    init_db()
    monkeypatch.setattr(settings, "demo_mode", False)
    with Session(engine) as s:
        org = Org()
        s.add(org)
        s.commit()
        s.refresh(org)
        yield s, org


def test_visitor_gets_one_scan_then_sign_in(live):
    s, org = live
    visitor = Caller(org, signed_in=False, ip_hash="ip-a")
    guard.check(s, visitor, "scan")
    s.add(Job(kind="scan", org_id=org.id, ip_hash="ip-a", status="done", cost_usd=0.5))
    s.commit()
    with pytest.raises(HTTPException) as e:
        guard.check(s, visitor, "scan")
    assert e.value.status_code == 429 and "Sign in" in e.value.detail
    guard.check(s, Caller(org, signed_in=True, ip_hash="ip-a"), "scan")  # signing in lifts it


def test_visitor_cannot_fix_or_track(live):
    s, org = live
    visitor = Caller(org, signed_in=False, ip_hash=None)
    for check in (lambda: guard.check(s, visitor, "fix"), lambda: guard.check_tracking(s, visitor, 1)):
        with pytest.raises(HTTPException) as e:
            check()
        assert e.value.status_code == 403


def test_daily_cap(live, monkeypatch):
    s, org = live
    member = Caller(org, signed_in=True, ip_hash=None)
    monkeypatch.setattr(settings, "daily_spend_cap_usd", guard.spent_today(s) + 1.0)
    guard.check(s, member, "discovery")
    s.add(Job(kind="scan", org_id=None, status="running"))  # a running scan counts at its estimate
    s.commit()
    with pytest.raises(HTTPException) as e:
        guard.check(s, member, "discovery")
    assert e.value.detail == guard.OVER_CAP
