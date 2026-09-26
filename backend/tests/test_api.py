"""End-to-end smoke test of the whole onboarding flow in DEMO_MODE (no network, no keys)."""

import json

import pytest
from fastapi.testclient import TestClient

from app.services import demo

H = {"X-Session-Id": "test-session"}


@pytest.fixture
def client(tmp_path, monkeypatch, opzelura):
    prompts = [
        {"text": "best cream for eczema?", "audience": "patient", "lane": "unbranded", "monitor_only": False},
        {"text": "how is Opzelura dosed?", "audience": "patient", "lane": "branded", "monitor_only": False},
    ]
    answers = [
        {"engine": "claude", "prompt_text": prompts[0]["text"], "text": "Try Dupixent.", "error": None,
         "mentioned": False, "position": None, "sentiment": "neutral", "competitors_mentioned": ["Dupixent"],
         "citations": [{"url": "https://www.webmd.com/a", "title": "WebMD"}], "accuracy_issues": []},
        {"engine": "claude", "prompt_text": prompts[1]["text"], "text": "Apply four times daily.", "error": None,
         "mentioned": True, "position": 1, "sentiment": "neutral", "competitors_mentioned": [], "citations": [],
         "accuracy_issues": [{"type": "dose", "ai_sentence": "Apply four times daily.",
                              "label_sentence": "Apply a thin layer twice daily.", "explanation": "wrong frequency",
                              "severity": "high"}]},
    ]
    bundle = {
        "company": {"name": "Incyte", "hq": "Wilmington, DE", "company_type": "biotech",
                    "therapeutic_areas": ["Dermatology"], "labeler_candidates": [], "status": "ready"},
        "products": [
            {"brand": "Opzelura", "molecule": "ruxolitinib", "indication": "Atopic dermatitis", "tier": "Rx",
             "label_set_id": "x", "label": opzelura["label"], "url": None, "selected": True, "is_hero": True,
             "search_rank": 1, "pipeline": False},
        ],
        "competitors": [{"brand": "Dupixent", "molecule": "dupilumab", "source": "openfda"}],
        "prompts": prompts,
        "answers": answers,
        "fixes": [{"key": "correct-dose", "title": "Correct the dose", "why": "wrong", "kind": "accuracy_correction",
                   "target_prompts": [prompts[1]["text"]]},
                  {"key": "faq", "title": "FAQ", "why": "lost", "kind": "faq", "target_prompts": []}],
        "drafts": [{"fix_key": "correct-dose", "title": "How Opzelura is used", "content_md": "# Draft",
                    "claims": [], "premlr": {"risk_score": 10, "risk_level": "low", "blocked": False,
                                             "fast_track": True, "flags": []}}],
    }
    path = tmp_path / "bundle.json"
    path.write_text(json.dumps(bundle))
    monkeypatch.setattr(demo, "BUNDLE", path)
    monkeypatch.setattr(demo, "STEP_DELAY", 0)
    monkeypatch.setattr(demo, "CELL_DELAY", 0)
    from app.main import app

    with TestClient(app) as c:
        yield c


def events(client, url) -> list[tuple[str, dict]]:
    out, event = [], None
    with client.stream("GET", url) as r:
        for line in r.iter_lines():
            if line.startswith("event:"):
                event = line.split(":", 1)[1].strip()
            elif line.startswith("data:"):
                out.append((event, json.loads(line.split(":", 1)[1])))
                if event in ("done", "error"):
                    break
    return out


def test_full_flow(client, monkeypatch):
    r = client.post("/api/onboarding", json={"url": "incyte.com"}, headers=H).json()
    evs = events(client, f"/api/onboarding/{r['job_id']}/events")
    assert evs[-1] == ("done", {"company_id": r["company_id"]})

    company = client.get(f"/api/companies/{r['company_id']}").json()
    assert company["name"] == "Incyte"
    hero = next(p for p in company["products"] if p["is_hero"])
    assert hero["has_boxed_warning"] and "label" not in hero

    setup = client.post(f"/api/products/{hero['id']}/setup").json()
    assert len(setup["prompts"]) == 2 and "lane" not in setup["prompts"][0]
    assert setup["competitors"][0]["brand"] == "Dupixent"

    assert [e["name"] for e in client.get("/api/engines").json() if e["enabled"]] == ["claude"]

    scan = client.post(f"/api/products/{hero['id']}/scans").json()
    evs = events(client, f"/api/scans/{scan['scan_id']}/events")
    assert sum(e == "answer" for e, _ in evs) == 2
    report_id = evs[-1][1]["report_id"]

    report = client.get(f"/api/reports/{report_id}").json()
    assert report["headline"]["you"]["score"] == 0  # the only unbranded question recommends Dupixent
    assert report["all_prompts"]["you"]["score"] == 50
    assert report["headline"]["top_competitor"]["brand"] == "Dupixent"
    assert report["accuracy_issues"][0]["type"] == "dose"
    assert report["lost_prompts"][0]["prompt"] == "best cream for eczema?"
    assert report["competitor_only_sources"][0]["domain"] == "webmd.com"

    r = client.post(f"/api/reports/{report_id}/fixes/correct-dose")
    assert r.status_code == 200 and r.json()["job_id"] is None  # recorded draft: ready immediately
    draft = client.get(f"/api/drafts/{r.json()['draft_id']}").json()
    assert draft["premlr"]["risk_score"] == 10
    assert client.post(f"/api/reports/{report_id}/fixes/correct-dose").json()["draft_id"] == draft["id"]  # idempotent

    # A fix with no recorded draft runs as a background job (drafting stubbed out here).
    from app.models import Draft
    from app.services import fix

    async def fake_draft(session, report, f, on_step=None):
        on_step("draft", "Drafting from the FDA label…")
        d = Draft(report_id=report.id, fix_key=f["key"], title="t", content_md="c", premlr={"risk_score": 5})
        session.add(d)
        session.commit()
        session.refresh(d)
        return d

    monkeypatch.setattr(fix, "create_draft", fake_draft)
    r = client.post(f"/api/reports/{report_id}/fixes/faq")
    assert r.status_code == 202
    evs = events(client, f"/api/fixes/{r.json()['job_id']}/events")
    assert evs[0][0] == "step" and evs[-1][0] == "done"
    assert client.get(f"/api/drafts/{evs[-1][1]['draft_id']}").json()["fix_key"] == "faq"

    saved = client.post("/api/orgs/save", json={"email": "Brand@Acme.com"}, headers=H).json()
    assert saved["email"] == "brand@acme.com"


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

    assert client.post(f"/api/companies/{company_id}/labeler", json={"labeler": "Nope"}).status_code == 422
    out = client.post(f"/api/companies/{company_id}/labeler", json={"labeler": "Acme Inc"}).json()
    by_brand = {p["brand"]: p for p in out["products"]}
    assert out["labeler_candidates"] == []
    assert by_brand["Alpha"]["partner"] and not by_brand["Alpha"]["selected"] and not by_brand["Alpha"]["is_hero"]
    assert by_brand["Beta"]["is_hero"] and not by_brand["Beta"]["partner"]
    assert not by_brand["Gamma"]["partner"]  # unindexed label: benefit of the doubt
