// Response shapes of the Aeon backend (backend/app). The OpenAPI spec doesn't describe responses yet, so these
// are written by hand from docs/architecture.md and checked against a live run. Everything is a yes/no check or
// a count of checks: no scores or percentages.

export type Audience = "patient" | "caregiver" | "hcp";
export type Severity = "high" | "medium" | "low";
export type QuestionKind = "unbranded" | "branded" | "comparison" | "off_label";

export type Health = {
  ok: boolean;
  demo_mode: boolean;
  /** Supabase sign-in is on. */
  auth: boolean;
  /** Site the demo recording is of. */
  demo_domain?: string;
};

export type Engine = { name: string; label: string; enabled: boolean; coming_soon: boolean; samples: number };

export type Me = { org_id: number; email: string | null; signed_in: boolean };

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
  /** Lower = more Google searches for the brand name. */
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
  kind: QuestionKind;
  /** google_paa: a real question people ask on Google. */
  source: "google_paa" | "claude" | "user";
  monitor_only: boolean;
};

export type SetupView = {
  competitors: Competitor[];
  prompts: Prompt[];
  markets: string[];
  languages: string[];
};

/** POST /products/{id}/setup: the setup if it exists, else a job to follow. */
export type SetupStart = { setup: SetupView | null; job_id: string | null };

// ---- Screen 5: scan -----------------------------------------------------------

export type ScanStart = { scan_id: number; engines: string[] };

export type ScanCounters = {
  /** Cells (question × engine) finished. */
  answers: number;
  total: number;
  /** Cells where AI names you. */
  mentions: number;
  /** Cells naming at least one competitor. */
  competitor_mentions: number;
  /** Cells whose answers contradict the label. */
  accuracy_issues: number;
  errors: number;
  not_shown: number;
};

export type Scan = {
  id: number;
  product_id: number;
  kind: "onboarding" | "weekly";
  status: "running" | "done" | "failed";
  engines: string[];
  stats: Partial<ScanCounters>;
  report_id: string | null;
  started_at: string;
  finished_at: string | null;
};

/** you: AI names you; competitor: it names a competitor instead; none: neither; not_shown: Google showed no answer. */
export type CellState = "you" | "competitor" | "none" | "not_shown" | "error";

/** One question × engine: the majority vote over its samples. */
export type Cell = {
  state: CellState;
  samples?: number;
  /** "2/3": how many samples named you. */
  votes?: string;
  mentioned?: boolean;
  /** 1 = first treatment named (median over the samples that named you). */
  position?: number | null;
  competitors_mentioned?: string[];
  label_conflict?: boolean;
  accuracy_issues?: number;
  cites_you?: boolean;
  error?: string | null;
};

export type CellEvent = Cell & { prompt_id: number; engine: string };

// ---- Screen 6: report ---------------------------------------------------------

export type Tally = { asked: number; you: number; competitor: number; none: number; not_shown: number; error: number };

export type EngineSummary = {
  label: string;
  unbranded: Tally;
  all: Tally;
  top_competitor: { brand: string; count: number } | null;
  label_conflicts: number;
};

export type AccuracyIssueType = "dose" | "indication" | "boxed_warning" | "contraindication" | "other";

export type AccuracyIssue = {
  type: AccuracyIssueType;
  severity: Severity;
  ai_sentence: string;
  label_sentence: string;
  explanation: string;
  engine: string;
  sample: number;
  prompt_id: number;
  prompt: string;
};

export type LostQuestion = { prompt_id: number; prompt: string; audience: Audience; engines: string[]; competitors: string[] };

export type SourceRow = {
  domain: string;
  citations: number;
  engines: string[];
  competitors: string[];
  cites_you: boolean;
  questions: string[];
};

export type FixKind = "accuracy_correction" | "on_page_content" | "faq" | "off_page";

export type Fix = { key: string; title: string; why: string; kind: FixKind; target_prompts: string[] };

export type ReportQuestion = {
  id: number;
  text: string;
  audience: Audience;
  kind: QuestionKind;
  source: Prompt["source"];
  cells: Record<string, Cell>;
};

export type Change = { prompt_id: number; prompt: string; engine: string; before: CellState; after: CellState };

export type Report = {
  id: string;
  created_at: string;
  product: { id: number; brand: string; molecule: string; indication: string; tier: string };
  company: { name: string; domain: string };
  engines: { name: string; label: string; samples: number }[];
  coming_soon: { name: string; label: string }[];
  questions: ReportQuestion[];
  summary: Record<string, EngineSummary>;
  competitors: { brand: string; by_engine: Record<string, number>; total: number }[];
  accuracy_issues: AccuracyIssue[];
  lost_questions: LostQuestion[];
  sources: {
    competitor_only: SourceRow[];
    yours: SourceRow[];
    by_competitor: Record<string, { domain: string; citations: number }[]>;
  };
  /** Cells that changed since the previous scan of the same drug; null on the first scan. */
  changes: Change[] | null;
  fixes: Fix[];
  methodology: string;
  scan: { id: number; kind: Scan["kind"] };
};

export type Citation = { url: string; title: string };

export type Answer = {
  id: number;
  scan_id: number;
  prompt_id: number;
  engine: string;
  sample: number;
  shown: boolean;
  text: string;
  error: string | null;
  mentioned: boolean;
  position: number | null;
  sentiment: "positive" | "neutral" | "negative";
  competitors_mentioned: string[];
  citations: Citation[];
  cites_you: boolean;
  accuracy_issues: Omit<AccuracyIssue, "engine" | "prompt" | "prompt_id" | "sample">[];
};

// ---- "Fix this" and pre-MLR ---------------------------------------------------

export type FixStart = { draft_id: number | null; job_id: string | null };

export type PremlrRule =
  | "unsupported_claim"
  | "off_label"
  | "fair_balance"
  | "overstatement"
  | "missing_isi"
  | "unsupported_comparison"
  | "other";

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

export type PremlrCheck = { id: string; label: string; passed: boolean; detail: string };

/** ready: every check passes · needs_changes · blocked: a claim isn't traceable to the label (no export). */
export type PremlrStatus = "ready" | "needs_changes" | "blocked";

export type Premlr = { status: PremlrStatus; blocked: boolean; checks: PremlrCheck[]; flags: PremlrFlag[] };

export type Round = { round: number; status: PremlrStatus; failed: string[]; checks?: Omit<PremlrCheck, "detail">[] };

export type DraftClaim = { text: string; label_section: string; label_quote: string };

export type Draft = {
  id: number;
  report_id: string | null;
  product_id: number | null;
  fix_key: string;
  title: string;
  content_md: string;
  claims: DraftClaim[];
  premlr: Premlr;
  rounds: Round[];
};

export type DraftSummary = { id: number; title: string; fix_key: string; report_id: string | null; status: PremlrStatus; rounds: number };

export type SaveResult = { ok: boolean; org_id: number; email: string };

// ---- Dashboard ----------------------------------------------------------------

export type HistoryRow = {
  scan_id: number;
  report_id: string;
  kind: Scan["kind"];
  finished_at: string;
  summary: Record<string, EngineSummary>;
  changes: number;
};

export type Tracking = { weekly: boolean; next_run_at: string | null };

export type Opportunity = {
  id: number;
  product_id: number;
  key: string;
  theme: string;
  competitors: string[];
  their_claims: string[];
  our_angle: string;
  /** Verbatim label text behind our angle. */
  label_support: string;
  format: string;
  draft_id: number | null;
};

export type Opportunities = {
  status: "queued" | "running" | "done" | "failed" | null;
  /** The promo research job, to follow its events while it runs. */
  job_id: string | null;
  opportunities: Opportunity[];
  ads: { competitor: string; advertiser: string; first_shown: string; url: string; ad_id: string }[];
};

// ---- Live progress (SSE) --------------------------------------------------------

export type StepEvent = { key: string; label: string; status?: "active" | "done"; pages?: number; count?: number };

export type StreamError = { message: string };

export type DiscoveryEvents = { step: StepEvent; done: { company_id: number }; error: StreamError };
export type SetupEvents = { step: StepEvent; done: { product_id: number }; error: StreamError };
export type ScanEvents = { answer: CellEvent; counters: ScanCounters; done: { report_id: string }; error: StreamError };
export type FixEvents = { step: StepEvent; round: Round; done: { draft_id: number }; error: StreamError };
export type PromoEvents = { step: StepEvent; done: { product_id: number }; error: StreamError };
