import { SEVERITY_RANK, engineLabel, plainText } from "@/lib/format";
import type { AccuracyIssue, CellState, FixKind, QuestionKind, Report, Severity } from "@/types/api";
import type { Tone } from "../ui";

/** The fix planner's text can arrive with literal unicode escapes (a backslash, "u", four hex digits); show the characters. */
export function decodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

/** A sentence quoted from Markdown, as plain text: plainText() plus headings, list markers, emphasis and code ticks. */
export function quoteText(markdown: string): string {
  return plainText(markdown.replace(/^[ \t]*(#{1,6}|[-*+])[ \t]+/gm, ""))
    .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1$2")
    .replace(/`([^`\n]+)`/g, "$1")
    .trim();
}

/** Engine id → label. The report carries its own labels (Google AI Mode isn't in format.ts). */
export function engineLabeler(report: Pick<Report, "engines" | "coming_soon">): (name: string) => string {
  const labels = new Map([...report.engines, ...report.coming_soon].map((e) => [e.name, e.label]));
  return (name) => labels.get(name) ?? engineLabel(name);
}

export const STATE_LABEL: Record<CellState, string> = {
  you: "Names you",
  competitor: "A competitor instead",
  none: "Neither named",
  not_shown: "No AI answer shown",
  error: "No answer",
};

export const KIND_LABEL: Record<QuestionKind, string> = {
  unbranded: "Unbranded",
  branded: "Branded",
  comparison: "Comparison",
  off_label: "Off-label",
};

export const SEVERITY_LABEL: Record<Severity, string> = { high: "High", medium: "Medium", low: "Low" };

/** Label conflicts that share a question, engine and type: the same mistake, repeated across Claude's samples. */
export type IssueGroup = {
  key: string;
  /** Highest severity first. */
  issues: AccuracyIssue[];
  severity: Severity;
  /** Distinct samples (answers) the mistake appeared in. */
  answers: number;
  /** Samples asked for this question × engine. */
  asked: number;
};

export function groupIssues(report: Pick<Report, "accuracy_issues" | "questions" | "engines">): IssueGroup[] {
  const groups = new Map<string, AccuracyIssue[]>();
  for (const issue of report.accuracy_issues) {
    const key = `${issue.prompt_id}|${issue.engine}|${issue.type}`;
    groups.set(key, [...(groups.get(key) ?? []), issue]);
  }
  const samplesFor = (promptId: number, engine: string) =>
    report.questions.find((q) => q.id === promptId)?.cells[engine]?.samples ??
    report.engines.find((e) => e.name === engine)?.samples ??
    1;

  return [...groups.entries()]
    .map(([key, list]) => {
      const issues = [...list].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
      const answers = new Set(list.map((i) => i.sample)).size;
      return {
        key,
        issues,
        severity: issues[0].severity,
        answers,
        asked: Math.max(samplesFor(issues[0].prompt_id, issues[0].engine), answers),
      };
    })
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.answers - a.answers);
}

/** "in 2 of 3 Claude answers", or just "Google AI Mode" when the engine answers once. */
export function answersPhrase(group: Pick<IssueGroup, "answers" | "asked">, label: string): string {
  return group.asked > 1 ? `in ${group.answers} of ${group.asked} ${label} answers` : label;
}

/** Fixes whose target questions include this one (the planner copies question texts, sometimes with escapes). */
export function fixesFor(report: Pick<Report, "fixes">, question: string) {
  const norm = (s: string) => decodeEscapes(s).trim().toLowerCase();
  return report.fixes.filter((f) => f.target_prompts.some((p) => norm(p) === norm(question)));
}

export const KIND_TONE: Record<FixKind, Tone> = {
  accuracy_correction: "alert",
  on_page_content: "periwinkle",
  faq: "lavender",
  off_page: "flame",
};

export function fixHref(reportId: string, key: string): string {
  return `/report/${reportId}/fix/${encodeURIComponent(key)}`;
}
