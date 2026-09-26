import { plural } from "@/lib/format";
import type { Draft, PremlrStatus, Round } from "@/types/api";
import type { Tone } from "../ui";

/** The fix agent's round limit (backend/app/config.py, fix_max_rounds). */
export const MAX_ROUNDS = 3;

export const STATUS_LABEL: Record<PremlrStatus, string> = {
  ready: "Ready for MLR review",
  needs_changes: "Needs changes",
  blocked: "Blocked",
};

export const ROUND_STATUS_LABEL: Record<PremlrStatus, string> = { ready: "Ready", needs_changes: "Needs changes", blocked: "Blocked" };

export const STATUS_TONE: Record<PremlrStatus, Tone> = { ready: "lime", needs_changes: "flame", blocked: "alert" };

export const SECTION_LABEL: Record<string, string> = {
  indications: "Indications",
  dosage: "Dosage",
  boxed_warning: "Boxed warning",
  contraindications: "Contraindications",
  warnings: "Warnings",
  adverse_reactions: "Adverse reactions",
};

export function sectionLabel(section: string): string {
  return SECTION_LABEL[section] ?? section.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** The draft's Markdown without a leading H1 that repeats its title (the page shows the title itself). */
export function draftBody(draft: Pick<Draft, "title" | "content_md">): string {
  const text = draft.content_md.replace(/^\s+/, "");
  const h1 = /^#[ \t]+(.+)(\r?\n|$)/.exec(text);
  return h1 && norm(h1[1]) === norm(draft.title) ? text.slice(h1[0].length).replace(/^\s+/, "") : text;
}

/** "Passed in round 3 of 3", or how it ended when it never passed. */
export function roundsSummary(rounds: Round[], status: PremlrStatus): string | null {
  if (rounds.length === 0) return null;
  const last = rounds.reduce((a, b) => (b.round > a.round ? b : a));
  if (status === "ready") return `Passed in round ${last.round} of ${Math.max(MAX_ROUNDS, rounds.length)}`;
  return `${status === "blocked" ? "Still blocked" : "Still needs changes"} after ${plural(rounds.length, "round")}`;
}

/** The draft as one Markdown document, titled once. */
export function draftMarkdown(draft: Pick<Draft, "title" | "content_md">): string {
  return `# ${draft.title}\n\n${draftBody(draft).trimEnd()}\n`;
}

const tableCell = (s: string) => s.replace(/\|/g, "\\|").replace(/\s*\n+\s*/g, " ").trim();

/** MLR package: the draft, a References table (claim → label section → verbatim quote) and the checklist. */
export function mlrPackage(draft: Draft, brand: string): string {
  const summary = roundsSummary(draft.rounds, draft.premlr.status);
  const date = new Date().toISOString().slice(0, 10);
  return [
    draftMarkdown(draft),
    "---",
    "",
    "## References",
    "",
    `Every factual claim in this draft, traced to the ${brand ? `${brand} ` : ""}FDA label. Quotes are verbatim.`,
    "",
    "| # | Claim | Label section | Verbatim label text |",
    "|---|---|---|---|",
    ...draft.claims.map(
      (c, i) => `| ${i + 1} | ${tableCell(c.text)} | ${tableCell(sectionLabel(c.label_section))} | “${tableCell(c.label_quote)}” |`
    ),
    "",
    "## Pre-MLR checklist",
    "",
    `**${STATUS_LABEL[draft.premlr.status]}**${summary ? ` · ${summary}` : ""}`,
    "",
    ...draft.premlr.checks.map((c) => `- [${c.passed ? "x" : " "}] ${c.label}${!c.passed && c.detail ? `: ${c.detail}` : ""}`),
    "",
    `_Prepared with Aeon on ${date}. A first pass for your MLR team, not a replacement for it._`,
    "",
  ].join("\n");
}

export function fileSlug(title: string): string {
  return (
    title
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60)
      .replace(/-$/, "") || "draft"
  );
}

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking in the same tick can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
