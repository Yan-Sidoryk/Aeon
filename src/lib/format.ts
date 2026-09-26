import type { AccuracyIssueType, Audience, FixKind, PremlrRule, Severity } from "@/types/api";

export const AUDIENCE_LABEL: Record<Audience, string> = {
  patient: "Patients",
  caregiver: "Caregivers",
  hcp: "Doctors",
};

export const AUDIENCE_SINGULAR: Record<Audience, string> = {
  patient: "Patient",
  caregiver: "Caregiver",
  hcp: "Doctor",
};

export const ISSUE_LABEL: Record<AccuracyIssueType, string> = {
  dose: "Dose",
  indication: "Indication",
  boxed_warning: "Boxed warning",
  contraindication: "Contraindication",
  other: "Other",
};

export const FIX_KIND_LABEL: Record<FixKind, string> = {
  accuracy_correction: "Accuracy correction",
  on_page_content: "On-page content",
  faq: "FAQ",
  off_page: "Off-page",
};

export const RULE_LABEL: Record<PremlrRule, string> = {
  unsupported_claim: "Unsupported claim",
  off_label: "Off-label",
  fair_balance: "Fair balance",
  overstatement: "Overstatement",
  missing_isi: "Safety information",
  other: "Other",
};

export const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** Engine labels for ids the report stores (the grid header uses /api/engines when it can). */
export const ENGINE_LABEL: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
  ai_overviews: "Google AI Overviews",
};

export function engineLabel(name: string): string {
  return ENGINE_LABEL[name] ?? name;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** "https://www.acme.com/x" or "acme.com" → "acme.com". */
export function bareDomain(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

/** A sentence quoted from a Markdown answer, without emphasis markers or table pipes. */
export function plainText(markdown: string): string {
  return markdown.replace(/\*\*|__/g, "").replace(/^\s*\|\s*|\s*\|\s*$/g, "").replace(/\s*\|\s*/g, " · ");
}
