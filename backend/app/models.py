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
    session_id: str = Field(index=True, unique=True)
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


class Scan(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    product_id: int = Field(foreign_key="product.id", index=True)
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
    text: str = ""
    error: str | None = None
    mentioned: bool = False
    position: int | None = None  # 1 = first product named in the answer
    sentiment: str = "neutral"
    competitors_mentioned: list[str] = JsonField([])
    citations: list[dict] = JsonField([])  # [{url, title}]
    accuracy_issues: list[dict] = JsonField([])


class Report(SQLModel, table=True):
    id: str = Field(default_factory=_uuid, primary_key=True)
    scan_id: int = Field(foreign_key="scan.id")
    payload: dict = JsonField({})
    created_at: datetime = Field(default_factory=_now)


class Draft(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    report_id: str = Field(foreign_key="report.id", index=True)
    fix_key: str
    title: str = ""
    content_md: str = ""
    claims: list[dict] = JsonField([])
    premlr: dict = JsonField({})
