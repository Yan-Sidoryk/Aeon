"""Run the full live pipeline for one website and save it as the demo bundle.

    python -m app.scripts.record_demo incyte.com [--hero Opzelura]
    python -m app.scripts.record_demo --company 4      # rescan an existing company's hero (keeps its prompts)
"""

import asyncio
import sys

from sqlmodel import Session, select

from app.db import engine, init_db
from app.engines.registry import enabled_engines
from app.jobs import LocalJob
from app.models import Company, Org, Product, Prompt, Report, Scan
from app.services import demo, discovery, fix, scan, setup


async def discover(url: str) -> int:
    with Session(engine) as s:
        sid = f"record-{url}"
        org = s.exec(select(Org).where(Org.session_id == sid)).first() or Org(session_id=sid)
        s.add(org)
        s.commit()
        company = Company(org_id=org.id, domain=url)
        s.add(company)
        s.commit()
        company_id = company.id
    job = LocalJob("rec-discovery")
    await discovery.run_discovery(job, company_id, url)
    print(*[e["data"] for e in job.events], sep="\n")
    return company_id


async def main(company_id: int, hero_brand: str | None = None) -> None:
    with Session(engine) as s:
        products = s.exec(select(Product).where(Product.company_id == company_id)).all()
        if hero_brand:  # pick a demo-friendly hero instead of the auto pick
            for p in products:
                p.is_hero = p.brand.lower() == hero_brand.lower()
                s.add(p)
            s.commit()
        hero = next(p for p in products if p.is_hero)
        print("hero:", hero.brand)
        if not s.exec(select(Prompt).where(Prompt.product_id == hero.id)).first():
            await setup.build_setup(s, hero)
        sc = Scan(product_id=hero.id, engines=[e.name for e in enabled_engines()])
        s.add(sc)
        s.commit()
        scan_id = sc.id

    job = LocalJob("rec-scan")
    await scan.run_scan(job, scan_id, enabled_engines())
    print(job.events[-1])

    with Session(engine) as s:
        report = s.get(Report, s.get(Scan, scan_id).report_id)
        for f in report.payload["fixes"]:
            print("drafting fix:", f["key"])
            await fix.create_draft(s, report, f)
    print("saved", demo.record(company_id))


def _arg(name: str) -> str | None:
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None


async def cli() -> None:
    init_db()
    company = _arg("--company")
    company_id = int(company) if company else await discover(sys.argv[1])
    await main(company_id, _arg("--hero"))


if __name__ == "__main__":
    asyncio.run(cli())
