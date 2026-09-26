// Response shapes of the Aeon backend (backend/app). The OpenAPI spec doesn't describe responses yet,
// so these are written by hand from docs/architecture.md and checked against the demo-mode API.

export type Audience = "patient" | "caregiver" | "hcp";
export type Severity = "high" | "medium" | "low";

export type Health = { ok: boolean; demo_mode: boolean; /** Site the demo recording is of. */ demo_domain?: string };

export type Engine = { name: string; label: string; enabled: boolean };

// ---- Screens 1-3: onboarding, portfolio, hero ------------------------------

export type OnboardingStart = { job_id: string; company_id: number };

export type Product = {
  id: number;
  company_id: number;
  brand: string;
  molecule: string;
  /** One line for the card. */
  indication: string;
  tier: string;
  label_set_id: string | null;
  url: string | null;
  selected: boolean;
  is_hero: boolean;
  search_rank: number;
  /** Unlaunched: shown, not scanned. */
  pipeline: boolean;
  /** Manufacturer on the FDA label. */
  labeler: string;
  /** Labeled by another company: starts unticked, can't be the hero. */
  partner: boolean;
  label_found: boolean;
  has_boxed_warning: boolean;
};

/** GET /api/products/{id}: the row with its full FDA label (sections as plain text). */
export type ProductDetail = Omit<Product, "label_found" | "has_boxed_warning"> & { label: Record<string, string> };

export type CompanyStatus = "discovering" | "ready" | "failed";

export type Company = {
  id: number;
  org_id: number;
  domain: string;
  name: string;
  hq: string;
  company_type: string;
  therapeutic_areas: string[];
  /** Two or more when the site maps to several FDA labelers ("Which of these are you?"). */
  labeler_candidates: string[];
  status: CompanyStatus;
  products: Product[];
};

// ---- Screen 4: setup ----------------------------------------------------------

export type Competitor = {
  id: number;
  product_id: number;
  brand: string;
  molecule: string;
  source: "openfda" | "llm" | "user";
};

export type Prompt = {
  id: number;
  product_id: number;
  text: string;
  audience: Audience;
  /** Off-label questions: asked and reported, never counted as a loss. */
  monitor_only: boolean;
};

export type SetupView = {
  competitors: Competitor[];
  prompts: Prompt[];
  markets: string[];
  languages: string[];
};

// ---- Screen 5: scan -----------------------------------------------------------

export type ScanStart = { scan_id: number; engines: string[] };

export type ScanCounters = {
  answers: number;
  total: number;
  mentions: number;
  /** Answers that name at least one competitor. */
  competitor_mentions: number;
  /** Individual issues, not answers: one answer can carry several. */
  accuracy_issues: number;
  errors: number;
};

export type Scan = {
  id: number;
  product_id: number;
  status: "running" | "done" | "failed";
  engines: string[];
  stats: Partial<ScanCounters>;
  report_id: string | null;
  started_at: string;
  finished_at: string | null;
};

export type GridCell = {
  prompt_id: number;
  engine: string;
  mentioned: boolean;
  /** 1 = first treatment named. */
  position: number | null;
  competitors_mentioned: string[];
  accuracy_issues: number;
};

export type AnswerEvent = GridCell & { error: string | null };

// ---- Screen 6: report ---------------------------------------------------------

export type Share = { score: number; mentions: number; n: number; ci95: [number, number] };

export type AccuracyIssueType = "dose" | "indication" | "boxed_warning" | "contraindication" | "other";

export type AccuracyIssue = {
  type: AccuracyIssueType;
  severity: Severity;
  ai_sentence: string;
  label_sentence: string;
  explanation: string;
  engine: string;
  prompt: string;
};

export type LostPrompt = {
  prompt_id: number;
  prompt: string;
  audience: Audience;
  engines_lost: number;
  competitors: string[];
};

export type CompetitorSource = { domain: string; citations: number; competitors: string[] };

export type FixKind = "accuracy_correction" | "on_page_content" | "faq" | "off_page";

export type Fix = { key: string; title: string; why: string; kind: FixKind; target_prompts: string[] };

export type Report = {
  id: string;
  created_at: string;
  company?: { name: string; domain: string };
  product: { id: number; brand: string; molecule: string; indication: string; tier: string };
  headline: {
    /** "unbranded" unless the prompt set has no unbranded questions. */
    scope: "unbranded" | "all";
    you: Share;
    top_competitor: Share & { brand: string | null };
  };
  all_prompts: { you: Share };
  competitors: Record<string, Share>;
  engines: Record<string, { n: number; you: number; top_competitor: number }>;
  accuracy_issues: AccuracyIssue[];
  lost_prompts: LostPrompt[];
  competitor_only_sources: CompetitorSource[];
  fixes: Fix[];
  prompts: { id: number; text: string; audience: Audience }[];
  grid: GridCell[];
  methodology: string;
};

export type Citation = { url: string; title: string };

export type Answer = GridCell & {
  id: number;
  scan_id: number;
  text: string;
  error: string | null;
  sentiment: "positive" | "neutral" | "negative";
  citations: Citation[];
  accuracy_issues: Omit<AccuracyIssue, "engine" | "prompt">[];
};

// ---- "Fix this" and pre-MLR ---------------------------------------------------

export type FixStart = { draft_id: number | null; job_id: string | null };

export type PremlrRule = "unsupported_claim" | "off_label" | "fair_balance" | "overstatement" | "missing_isi" | "other";

export type PremlrFlag = {
  /** Sentence from the draft; empty for whole-document checks. */
  excerpt: string;
  rule: PremlrRule;
  severity: Severity;
  suggestion: string;
  source: "rule" | "ai" | "system";
  /** The banned phrase a rule matched, when there is one. */
  match?: string;
};

export type Premlr = {
  risk_score: number;
  risk_level: Severity;
  /** An unreferenced claim: no export until it's fixed. */
  blocked: boolean;
  fast_track: boolean;
  flags: PremlrFlag[];
};

export type DraftClaim = { text: string; label_section: string; label_quote: string };

export type Draft = {
  id: number;
  report_id: string;
  fix_key: string;
  title: string;
  content_md: string;
  claims: DraftClaim[];
  premlr: Premlr;
};

export type SaveResult = { ok: boolean; org_id: number; email: string };

// ---- Live progress (SSE) --------------------------------------------------------

export type StepEvent = {
  key: string;
  label: string;
  status?: "active" | "done";
  pages?: number;
  count?: number;
};

export type StreamError = { message: string };

export type DiscoveryEvents = { step: StepEvent; done: { company_id: number }; error: StreamError };
export type ScanEvents = { answer: AnswerEvent; counters: ScanCounters; done: { report_id: string }; error: StreamError };
export type FixEvents = { step: StepEvent; done: { draft_id: number }; error: StreamError };
