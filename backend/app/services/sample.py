"""The sample report: the recorded demo run, loaded once into the database as an ordinary public report, so anyone
can see a full report and its recorded "Fix this" draft before (or instead of) running their own. Its payload says
it's a sample and which site it's of; the report page shows that, and "Fix this" only opens the recorded draft.

Seeded at startup in live mode (demo mode replays the recording for every run anyway). It belongs to an internal
account no sign-in can reach: its user_id "sample:<recorded_at>" is never a Supabase user id, and it has no
session id."""

import logging

from sqlmodel import Session, select

from app.db import engine
from app.jobs import LocalJob
from app.models import Company, Org, Product, Report, Scan
from app.services import demo

log = logging.getLogger("aeon.sample")
_state: dict[str, str | None] = {"report_id": None}


def report_id() -> str | None:
    return _state["report_id"]


def _hero_id(s: Session, company_id: int) -> int | None:
    hero = s.exec(select(Product).where(Product.company_id == company_id, Product.is_hero == True)).first()  # noqa: E712
    return hero.id if hero else None


def _existing(s: Session, org: Org) -> str | None:
    for company in s.exec(select(Company).where(Company.org_id == org.id).order_by(Company.id.desc())):
        hero_id = _hero_id(s, company.id)
        scan = hero_id and s.exec(select(Scan).where(Scan.product_id == hero_id, Scan.status == "done")).first()
        if scan and scan.report_id:
            return scan.report_id
    return None


async def seed() -> str | None:
    """Load the recording as the sample report, once per recording; returns its report id."""
    if not demo.available():
        return None
    b = demo.load()
    owner = f"sample:{b['recorded_at']}"
    with Session(engine) as s:
        org = s.exec(select(Org).where(Org.user_id == owner)).first()
        if org and (existing := _existing(s, org)):
            _state["report_id"] = existing
            return existing
        org = org or Org(user_id=owner)  # an earlier seed that stopped halfway leaves the account: reuse it
        s.add(org)
        s.commit()
        s.refresh(org)
        company = Company(org_id=org.id, domain=b["company"]["domain"])
        s.add(company)
        s.commit()
        s.refresh(company)
        company_id = company.id
    await demo.replay_discovery(LocalJob(), company_id)
    with Session(engine) as s:
        hero_id = _hero_id(s, company_id)
    if hero_id is None or not await demo.replay_setup(LocalJob(), hero_id):
        raise RuntimeError("the recording has no hero drug with recorded questions")
    with Session(engine) as s:
        scan = Scan(product_id=hero_id, engines=b["engines"])
        s.add(scan)
        s.commit()
        s.refresh(scan)
        scan_id = scan.id
    await demo.replay_scan(LocalJob(), scan_id)
    with Session(engine) as s:
        report = s.get(Report, s.get(Scan, scan_id).report_id)
        report.payload = {**report.payload, "sample": {"domain": b["company"]["domain"], "recorded_at": b["recorded_at"]}}
        s.add(report)
        s.commit()
        rid = report.id
    for key in demo.recorded_fix_keys():
        await demo.replay_fix(LocalJob(), rid, key)
    _state["report_id"] = rid
    log.info("sample report %s seeded from the recording of %s", rid, b["company"]["domain"])
    return rid


async def seed_quietly() -> None:
    """For startup: a failed seed only means no sample link; it must not stop the API."""
    try:
        await seed()
    except Exception:
        log.exception("sample report not seeded")
