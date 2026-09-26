"""End-to-end smoke test of the whole flow in DEMO_MODE (no network, no keys): durable jobs, SSE replay,
checks-based report, the recorded fix loop, promo opportunities, ownership."""

import json

import pytest
from fastapi.testclient import TestClient

from app.services import demo

H = {"X-Session-Id": "test-session"}
Q1, Q2 = "best cream for eczema?", "how is Opzelura dosed?"


def _bundle(opzelura: dict) -> dict:
    issue = {"type": "dose", "ai_sentence": "Apply four times daily.", "label_sentence": "Apply a thin layer twice daily.",
             "explanation": "wrong frequency", "severity": "high"}
    answer = dict(error=None, sentiment="neutral", position=None, shown=True, cites_you=False, accuracy_issues=[],
                  citations=[], competitors_mentioned=[], mentioned=False, text="")
    answers = [
        # Q1 (unbranded): Claude recommends Dupixent in 2 of 3 samples; Google shows no AI Overview
        *[{**answer, "engine": "claude", "sample": i, "prompt_text": Q1, "text": "Try Dupixent.",
           "competitors_mentioned": ["Dupixent"], "citations": [{"url": "https://www.webmd.com/a", "title": "WebMD"}]}
          for i in (0, 1)],
        {**answer, "engine": "claude", "sample": 2, "prompt_text": Q1, "text": "Opzelura may help.", "mentioned": True},
        {**answer, "engine": "google_aio", "sample": 0, "prompt_text": Q1, "shown": False},
        # Q2 (branded): mentioned, with a label conflict
        *[{**answer, "engine": "claude", "sample": i, "prompt_text": Q2, "text": "Apply four times daily.",
           "mentioned": True, "position": 1, "accuracy_issues": [issue]} for i in range(3)],
        {**answer, "engine": "google_aio", "sample": 0, "prompt_text": Q2, "text": "Opzelura is applied twice daily.",
         "mentioned": True, "position": 1},
    ]
    premlr_ready = {"status": "ready", "blocked": False, "flags": [],
                    "checks": [{"id": "isi", "label": "ISI", "passed": True, "detail": ""}]}
    return {
        "version": 2,
        "company": {"name": "Incyte", "hq": "Wilmington, DE", "company_type": "biotech", "domain": "incyte.com",
                    "therapeutic_areas": ["Dermatology"], "labeler_candidates": [], "status": "ready"},
        "products": [{"brand": "Opzelura", "molecule": "ruxolitinib", "indication": "Atopic dermatitis", "tier": "Rx",
                      "label_set_id": "x", "label": opzelura["label"], "url": None, "selected": True, "is_hero": True,
                      "search_rank": -33100, "pipeline": False, "labeler": "Incyte Corporation", "partner": False}],
        "competitors": [{"brand": "Dupixent", "molecule": "dupilumab", "source": "openfda"}],
        "prompts": [{"text": Q1, "audience": "patient", "lane": "unbranded", "monitor_only": False, "source": "google_paa"},
                    {"text": Q2, "audience": "patient", "lane": "branded", "monitor_only": False, "source": "claude"}],
        "answers": answers,
        "engines": ["claude", "google_aio"],
        "fixes": [{"key": "correct-dose", "title": "Correct the dose", "why": "wrong", "kind": "accuracy_correction",
                   "target_prompts": [Q2]},
                  {"key": "faq", "title": "FAQ", "why": "lost", "kind": "faq", "target_prompts": []}],
        "drafts": [{"fix_key": "correct-dose", "title": "How Opzelura is used", "content_md": "# Draft", "claims": [],
                    "premlr": premlr_ready, "rounds": [{"round": 1, "status": "needs_changes", "failed": ["ISI"], "checks": []},
                                                       {"round": 2, "status": "ready", "failed": [], "checks": []}]}],
        "opportunities": [{"key": "steroid-free", "theme": "Steroid-free", "competitors": ["Dupixent"],
                           "their_claims": ["No steroids"], "ad_ids": [], "our_angle": "Non-steroidal cream",
                           "label_support": "x", "format": "patient FAQ page", "created_at": "2026-09-26T00:00:00"}],
        "ads": [],
        "events": {
            "discovery": [{"event": "step", "data": {"key": "s1", "label": "Reading incyte.com", "status": "done"}},
                          {"event": "done", "data": {"company_id": 99}}],
            "setup": [{"event": "step", "data": {"key": "s1", "label": "Competitor: Dupixent", "status": "done"}}],
            "scan": [{"event": "answer", "data": {"prompt_id": 501, "engine": "claude", "state": "competitor"}},
                     {"event": "counters", "data": {"answers": 1, "total": 4}}],
            "scan_prompts": {"501": Q1, "502": Q2},
            "promo": [{"event": "step", "data": {"key": "p1", "label": "Opportunity: Steroid-free", "status": "done"}}],
            "fixes": {"correct-dose": [{"event": "round", "data": {"round": 1, "status": "needs_changes", "failed": ["ISI"]}},
                                       {"event": "round", "data": {"round": 2, "status": "ready", "failed": []}}]},
        },
    }


@pytest.fixture
def client(tmp_path, monkeypatch, opzelura):
    path = tmp_path / "bundle.json"
    path.write_text(json.dumps(_bundle(opzelura)))
    monkeypatch.setattr(demo, "BUNDLE", path)
    monkeypatch.setattr(demo, "STEP_DELAY", 0)
    monkeypatch.setattr(demo, "CELL_DELAY", 0)
    demo._cache.clear()
    from app.main import app

    with TestClient(app, headers=H) as c:
        yield c
    demo._cache.clear()


def events(client, url) -> list[tuple[str, dict]]:
    out, event = [], None
    with client.stream("GET", url) as r:
        assert r.status_code == 200, url
        for line in r.iter_lines():
            if line.startswith("event:"):
                event = line.split(":", 1)[1].strip()
            elif line.startswith("data:"):
                out.append((event, json.loads(line.split(":", 1)[1])))
                if event in ("done", "error"):
                    break
    return out


def test_full_flow(client, monkeypatch):
    r = client.post("/api/onboarding", json={"url": "incyte.com"}).json()
    evs = events(client, f"/api/onboarding/{r['job_id']}/events")
    assert evs[0][1]["label"] == "Reading incyte.com"
    assert evs[-1] == ("done", {"company_id": r["company_id"]})

    company = client.get(f"/api/companies/{r['company_id']}").json()
    assert company["name"] == "Incyte" and company["domain"] == "incyte.com"
    hero = next(p for p in company["products"] if p["is_hero"])
    assert hero["has_boxed_warning"] and "label" not in hero

    started = client.post(f"/api/products/{hero['id']}/setup")
    assert started.status_code == 202
    assert events(client, f"/api/setup/{started.json()['job_id']}/events")[-1][0] == "done"
    assert client.post(f"/api/products/{hero['id']}/setup").status_code == 200  # idempotent once built
    setup = client.get(f"/api/products/{hero['id']}/setup").json()
    assert len(setup["prompts"]) == 2 and "lane" not in setup["prompts"][0] and setup["prompts"][0]["kind"] == "unbranded"
    assert setup["competitors"][0]["brand"] == "Dupixent"

    engines = client.get("/api/engines").json()
    assert [e["name"] for e in engines if e["enabled"]] == ["claude", "google_aio"]
    assert {e["name"] for e in engines if e["coming_soon"]} == {"chatgpt", "gemini", "perplexity"}

    scan = client.post(f"/api/products/{hero['id']}/scans").json()
    evs = events(client, f"/api/scans/{scan['scan_id']}/events")
    answer_events = [d for e, d in evs if e == "answer"]
    assert len(answer_events) == 1 and answer_events[0]["prompt_id"] != 501  # remapped to this run's prompt id
    report_id = evs[-1][1]["report_id"]

    report = client.get(f"/api/reports/{report_id}").json()
    claude = report["summary"]["claude"]
    assert claude["unbranded"]["competitor"] == 1 and claude["unbranded"]["you"] == 0  # Dupixent wins 2 of 3
    assert report["summary"]["google_aio"]["unbranded"]["not_shown"] == 1
    assert report["questions"][0]["cells"]["claude"]["votes"] == "1/3"
    assert report["accuracy_issues"][0]["type"] == "dose"
    assert report["lost_questions"][0]["prompt"] == Q1
    assert report["sources"]["competitor_only"][0]["domain"] == "webmd.com"
    assert "headline" not in report  # checks and counts, no scores

    # recorded fix: replays the loop's rounds, then the draft exists
    r = client.post(f"/api/reports/{report_id}/fixes/correct-dose")
    assert r.status_code == 202
    evs = events(client, f"/api/fixes/{r.json()['job_id']}/events")
    assert [d["round"] for e, d in evs if e == "round"] == [1, 2] and evs[-1][0] == "done"
    draft = client.get(f"/api/drafts/{evs[-1][1]['draft_id']}").json()
    assert draft["premlr"]["status"] == "ready" and len(draft["rounds"]) == 2
    assert client.get(f"/api/reports/{report_id}/drafts/correct-dose").status_code == 200  # public with the report
    assert client.post(f"/api/reports/{report_id}/fixes/correct-dose").json()["draft_id"] == draft["id"]  # idempotent

    # a fix with no recording runs the live agent (stubbed here)
    from app.agents import fix
    from app.models import Draft

    async def fake_draft(job, product, brief, *, fix_key, report_id=None):
        from sqlmodel import Session

        from app.db import engine

        job.emit("round", {"round": 1, "status": "ready", "failed": []})
        with Session(engine) as s:
            d = Draft(report_id=report_id, product_id=product.id, fix_key=fix_key, title="t", content_md="c",
                      premlr={"status": "ready", "checks": []}, rounds=[{"round": 1}])
            s.add(d)
            s.commit()
            s.refresh(d)
            s.expunge(d)
        return d

    monkeypatch.setattr(fix, "draft_with_review", fake_draft)
    r = client.post(f"/api/reports/{report_id}/fixes/faq")
    assert r.status_code == 202
    evs = events(client, f"/api/fixes/{r.json()['job_id']}/events")
    assert evs[0][0] == "round" and evs[-1][0] == "done"

    # promo opportunities replay
    r = client.post(f"/api/products/{hero['id']}/opportunities")
    assert events(client, f"/api/promo/{r.json()['job_id']}/events")[-1][0] == "done"
    opps = client.get(f"/api/products/{hero['id']}/opportunities").json()
    assert opps["opportunities"][0]["key"] == "steroid-free"

    history = client.get(f"/api/products/{hero['id']}/history").json()
    assert history[0]["report_id"] == report_id
    assert client.get(f"/api/products/{hero['id']}/drafts").json()[0]["status"] == "ready"

    saved = client.post("/api/orgs/save", json={"email": "Brand@Acme.com"}).json()
    assert saved["email"] == "brand@acme.com"


def test_ownership_and_public_report(client):
    """Another browser can read the shared report but not the company or its drafts."""
    r = client.post("/api/onboarding", json={"url": "incyte.com"}).json()
    events(client, f"/api/onboarding/{r['job_id']}/events")
    other = {"X-Session-Id": "someone-else"}
    assert client.get(f"/api/companies/{r['company_id']}", headers=other).status_code == 404
    assert client.get(f"/api/companies/{r['company_id']}").status_code == 200
    assert client.get("/api/companies", headers=other).json() == []


def test_choose_labeler(client):
    from sqlmodel import Session

    from app.db import engine
    from app.models import Company, Org, Product

    with Session(engine) as s:
        org = Org(session_id="labeler-test")
        s.add(org)
        s.commit()
        company = Company(org_id=org.id, domain="acme.com", status="ready", labeler_candidates=["Acme Inc", "Acme Labs"])
        s.add(company)
        s.commit()
        s.add_all([
            Product(company_id=company.id, brand="Alpha", labeler="Acme Labs", search_rank=1, is_hero=True),
            Product(company_id=company.id, brand="Beta", labeler="Acme Inc", search_rank=2),
            Product(company_id=company.id, brand="Gamma", labeler="", search_rank=3),
        ])
        s.commit()
        company_id = company.id

    owner = {"X-Session-Id": "labeler-test"}
    assert client.post(f"/api/companies/{company_id}/labeler", json={"labeler": "Acme Inc"}).status_code == 404
    assert client.post(f"/api/companies/{company_id}/labeler", json={"labeler": "Nope"}, headers=owner).status_code == 422
    out = client.post(f"/api/companies/{company_id}/labeler", json={"labeler": "Acme Inc"}, headers=owner).json()
    by_brand = {p["brand"]: p for p in out["products"]}
    assert out["labeler_candidates"] == []
    assert by_brand["Alpha"]["partner"] and not by_brand["Alpha"]["selected"] and not by_brand["Alpha"]["is_hero"]
    assert by_brand["Beta"]["is_hero"] and not by_brand["Beta"]["partner"]
    assert not by_brand["Gamma"]["partner"]  # unindexed label: benefit of the doubt


def test_jobs_survive_restart():
    """A job left 'running' by a crash is re-queued, and enqueuing it again joins instead of duplicating."""
    from sqlmodel import Session

    from app import jobs
    from app.db import engine, init_db
    from app.models import Job, JobEvent

    init_db()
    with Session(engine) as s:
        s.add(Job(id="crashed-1", kind="discovery", status="running", attempts=1))
        s.add(JobEvent(job_id="crashed-1", event="step", data={"key": "read"}))
        s.commit()
    assert jobs.resume_interrupted() >= 1
    with Session(engine) as s:
        assert s.get(Job, "crashed-1").status == "queued"
    assert jobs.enqueue("discovery", {}, job_id="crashed-1") == "crashed-1"


def test_weekly_schedule_starts_a_scan(client):
    from datetime import datetime, timedelta, timezone

    from sqlmodel import Session, select

    from app.db import engine
    from app.models import Scan, Schedule
    from app.scheduler import run_due

    r = client.post("/api/onboarding", json={"url": "incyte.com"}).json()
    events(client, f"/api/onboarding/{r['job_id']}/events")
    hero = next(p for p in client.get(f"/api/companies/{r['company_id']}").json()["products"] if p["is_hero"])
    assert client.put(f"/api/products/{hero['id']}/tracking", params={"weekly": True}).json()["weekly"] is True
    with Session(engine) as s:
        sched = s.exec(select(Schedule).where(Schedule.product_id == hero["id"])).one()
        sched.next_run_at = datetime.now(timezone.utc) - timedelta(minutes=1)
        s.add(sched)
        s.commit()
    started = run_due()
    assert len(started) == 1
    with Session(engine) as s:
        assert s.get(Scan, started[0]).kind == "weekly"
