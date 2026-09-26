"""Pydantic models: LLM structured outputs and API request bodies."""

from typing import Literal

from pydantic import BaseModel

Audience = Literal["patient", "caregiver", "hcp"]
Lane = Literal["branded", "unbranded", "comparison", "off_label"]


# ---- LLM outputs ----------------------------------------------------------

class SiteProduct(BaseModel):
    brand: str
    molecule: str | None = None
    url: str | None = None
    pipeline: bool = False


class SiteExtract(BaseModel):
    company_name: str
    hq: str
    company_type: str
    therapeutic_areas: list[str]
    products: list[SiteProduct]


class EnrichedProduct(BaseModel):
    brand: str
    indication_one_line: str
    therapeutic_area: str
    demand_rank: int  # 1 = most search demand


class PortfolioEnrich(BaseModel):
    products: list[EnrichedProduct]


class CompetitorOut(BaseModel):
    brand: str
    molecule: str


class CompetitorPick(BaseModel):
    competitors: list[CompetitorOut]


class PromptOut(BaseModel):
    text: str
    audience: Audience
    lane: Lane


class PromptSet(BaseModel):
    prompts: list[PromptOut]


class AnswerParse(BaseModel):
    mentioned: bool
    position: int | None  # rank of our brand among treatments named, 1 = first
    competitors_mentioned: list[str]
    sentiment: Literal["positive", "neutral", "negative"]


class AccuracyIssue(BaseModel):
    type: Literal["dose", "indication", "boxed_warning", "contraindication", "other"]
    ai_sentence: str
    label_sentence: str
    explanation: str
    severity: Literal["high", "medium", "low"]


class AccuracyCheck(BaseModel):
    issues: list[AccuracyIssue]


class FixOut(BaseModel):
    key: str  # short slug
    title: str
    why: str
    kind: Literal["accuracy_correction", "on_page_content", "faq", "off_page"]
    target_prompts: list[str]


class FixPlan(BaseModel):
    fixes: list[FixOut]


class DraftClaim(BaseModel):
    text: str
    label_section: str
    label_quote: str


class DraftOut(BaseModel):
    title: str
    content_md: str
    claims: list[DraftClaim]


class ReviewFlag(BaseModel):
    excerpt: str
    rule: Literal["unsupported_claim", "off_label", "fair_balance", "overstatement", "missing_isi", "other"]
    severity: Literal["high", "medium", "low"]
    suggestion: str


class ClaimReview(BaseModel):
    flags: list[ReviewFlag]


# ---- API bodies ------------------------------------------------------------

class OnboardingIn(BaseModel):
    url: str


class ProductPatch(BaseModel):
    selected: bool


class AddProductIn(BaseModel):
    brand: str


class LabelerIn(BaseModel):
    labeler: str


class CompetitorIn(BaseModel):
    brand: str
    molecule: str = ""


class PromptIn(BaseModel):
    text: str
    audience: Audience = "patient"
    lane: Lane = "unbranded"


class SaveIn(BaseModel):
    email: str
