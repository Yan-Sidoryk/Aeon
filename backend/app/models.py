import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return uuid.uuid4().hex


def JsonField(default: Any = None) -> Any:
    factory = (lambda: type(default)()) if isinstance(default, (list, dict)) else (lambda: default)
    return Field(default_factory=factory, sa_column=Column(JSON))


class Org(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    session_id: str | None = Field(default=None, index=True, unique=True)  # pre-auth / demo sessions
    user_id: str | None = Field(default=None, index=True, unique=True)  # Supabase auth user (anonymous or email)
    email: str | None = None
    created_at: datetime = Field(default_factory=_now)


class Company(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    org_id: int = Field(foreign_key="org.id", index=True)
    domain: str
    name: str = ""
    hq: str = ""
    company_type: str = ""
    therapeutic_areas: list[str] = JsonField([])
    # Labeler names from openFDA when the site maps to several ("Which of these are you?")
    labeler_candidates: list[str] = JsonField([])
    status: str = "discovering"  # discovering | ready | failed


class Product(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id", index=True)
    brand: str
    molecule: str = ""
    indication: str = ""  # one line for the card
    tier: str = "Rx"  # Rx | OTC
    label_set_id: str | None = None
    label: dict = JsonField({})  # indications, dosage, boxed_warning, contraindications, warnings
    url: str | None = None
    selected: bool = True
    is_hero: bool = False
    search_rank: int = 0
    pipeline: bool = False
    labeler: str = ""  # manufacturer on the FDA label
    partner: bool = False  # labeled by another company (licensed/co-marketed): shown, unticked, never hero


class Competitor(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    brand: str
    molecule: str = ""
    source: str = "llm"  # openfda | llm | user


class Prompt(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    text: str
    audience: str = "patient"  # patient | caregiver | hcp
    lane: str = "unbranded"  # branded | unbranded | comparison | off_label
    monitor_only: bool = False
    source: str = "claude"  # google_paa (a real question people ask on Google) | claude | user


class Scan(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    kind: str = "onboarding"  # onboarding | weekly
    status: str = "running"  # running | done | failed
    engines: list[str] = JsonField([])
    stats: dict = JsonField({})
    report_id: str | None = None
    started_at: datetime = Field(default_factory=_now)
    finished_at: datetime | None = None


class Answer(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    scan_id: int = Field(foreign_key="scan.id", index=True)
    prompt_id: int = Field(foreign_key="prompt.id")
    engine: str
    sample: int = 0  # Claude is asked several times per question; checks are a majority vote
    shown: bool = True  # False when Google showed no AI Overview / AI Mode answer for the query
    text: str = ""
    error: str | None = None
    mentioned: bool = False
    position: int | None = None  # 1 = first product named in the answer
    sentiment: str = "neutral"
    competitors_mentioned: list[str] = JsonField([])
    citations: list[dict] = JsonField([])  # [{url, title}]
    cites_you: bool = False  # a citation is on the company's or brand's own domains
    accuracy_issues: list[dict] = JsonField([])


class Report(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    scan_id: int = Field(foreign_key="scan.id")
    payload: dict = JsonField({})
    created_at: datetime = Field(default_factory=_now)


class Draft(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    report_id: str | None = Field(default=None, foreign_key="report.id", index=True)
    product_id: int | None = Field(default=None, foreign_key="product.id", index=True)
    fix_key: str
    title: str = ""
    content_md: str = ""
    claims: list[dict] = JsonField([])
    premlr: dict = JsonField({})  # {status, checks: [{id, label, passed, detail}], flags: [...]}
    rounds: list[dict] = JsonField([])  # fix loop history: [{round, checks, failed}]


# ---- Durable jobs (replace the in-memory job log) ----------------------------

class Job(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    kind: str  # discovery | setup | scan | fix | promo
    status: str = "queued"  # queued | running | done | failed
    params: dict = JsonField({})
    result: dict = JsonField({})
    error: str | None = None
    attempts: int = 0
    org_id: int | None = Field(default=None, foreign_key="org.id", index=True)
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


class JobEvent(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    job_id: str = Field(foreign_key="job.id", index=True)
    event: str  # step | answer | counters | round | done | error
    data: dict = JsonField({})
    created_at: datetime = Field(default_factory=_now)


class Schedule(SQLModel, table=True):
    """Weekly tracking: re-run the product's scan on a cadence."""
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True, unique=True)
    active: bool = True
    every_days: int = 7
    next_run_at: datetime = Field(default_factory=_now)
    last_scan_id: int | None = None


# ---- Promo opportunities (competitor ads via Apify) ----------------------------

class CompetitorAd(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    competitor: str
    ad_id: str = ""
    page_name: str = ""
    body: str = ""
    title: str = ""
    cta: str = ""
    url: str = ""  # Ad Library link
    platforms: list[str] = JsonField([])
    started_at: str = ""
    fetched_at: datetime = Field(default_factory=_now)


class Opportunity(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
    key: str  # slug, used in URLs
    theme: str
    competitors: list[str] = JsonField([])
    their_claims: list[str] = JsonField([])  # what competitors' ads say, quoted
    ad_ids: list[str] = JsonField([])
    our_angle: str = ""
    label_support: str = ""  # verbatim label text that supports our angle
    format: str = ""  # e.g. "patient FAQ page", "HCP email", "social post"
    created_at: datetime = Field(default_factory=_now)
