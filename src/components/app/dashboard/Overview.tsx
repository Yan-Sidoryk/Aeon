"use client";

import { ArrowRight, CalendarClock, CircleCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { formatDate, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CellState, DraftSummary, HistoryRow, Report, Tracking } from "@/types/api";
import { CheckLegend, CheckStrip, DraftStatusBadge, StatePill, sortChecks, type Check } from "./checks";
import { useDashboard } from "./context";
import { EngineMark, reportEngineLabel, shortEngineLabel } from "./engines";
import { ArrowLink, CountOf, PanelTitle, WithReport } from "./parts";
import { SCAN_KIND_LABEL, ScanHistory, type HistoryEntry } from "./ScanHistory";
import { useApi } from "./useApi";
import { Badge, Panel, Skeleton } from "../ui";

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Overview: this week's checks per engine, what changed, label conflicts, next scan, history, drafts and links. */
export function Overview() {
  return <WithReport>{(report) => <OverviewBody report={report} />}</WithReport>;
}

function OverviewBody({ report }: { report: Report }) {
  const { productId, history } = useDashboard();
  const tracking = useApi(`tracking:${productId}`, () => api.tracking(productId));
  const drafts = useApi(`drafts:${productId}`, () => api.drafts(productId));
  const previous = history?.[1];

  return (
    <div className="flex flex-col gap-4">
      <ChecksPanel report={report} previous={previous} />
      <div className="grid gap-4 lg:grid-cols-2">
        <WhatChanged report={report} previous={previous} tracking={tracking.data} />
        <LabelConflicts report={report} />
      </div>
      <HistoryPanel report={report} history={history ?? []} tracking={tracking.data} />
      <div className="grid gap-4 xl:grid-cols-2">
        <LatestDrafts drafts={drafts.data} error={drafts.error} />
        <Explore report={report} />
      </div>
    </div>
  );
}

// ---- This week's checks ----------------------------------------------------------------------------------------------

function ChecksPanel({ report, previous }: { report: Report; previous: HistoryRow | undefined }) {
  const brand = report.product.brand;
  const live = report.engines.filter((e) => report.summary[e.name]);
  const unbranded = report.questions.filter((q) => q.kind === "unbranded");
  const you = sum(live.map((e) => report.summary[e.name].unbranded.you));
  const asked = sum(live.map((e) => report.summary[e.name].unbranded.asked));
  const before = previous ? sum(Object.values(previous.summary).map((s) => s.unbranded.you)) : null;

  return (
    <Panel className="p-5 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-stone">
          Latest scan · {formatDate(report.created_at)}
          <Badge tone="white" className="h-5 px-2 text-[11px]">
            {SCAN_KIND_LABEL[report.scan.kind]}
          </Badge>
        </p>
        <ArrowLink href={`/report/${report.id}`} external>
          Full report
        </ArrowLink>
      </div>

      <p className="mt-4 font-display text-[28px] leading-[1.12] font-medium tracking-[-0.025em] text-pretty md:text-[34px]">
        AI names {brand} in{" "}
        <span className="whitespace-nowrap">
          <span className="text-royal-dark">{you}</span> of {asked}
        </span>{" "}
        unbranded checks.
      </p>
      <p className="mt-3 flex max-w-[760px] flex-wrap items-center gap-x-3 gap-y-2 text-[14px] leading-[1.5] text-stone">
        <span>
          {plural(unbranded.length, "unbranded question")} × {plural(live.length, "engine")}. These questions don&apos;t
          name a drug, so AI decides what to recommend.
        </span>
        {before !== null && <Delta now={you} before={before} />}
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {live.map((engine) => (
          <EngineCard
            key={engine.name}
            report={report}
            engine={engine.name}
            label={engine.label}
            before={previous?.summary[engine.name]?.unbranded.you}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <CheckLegend brand={brand} />
        {report.coming_soon.length > 0 && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-taupe">
            <span className="font-medium">Coming soon</span>
            {report.coming_soon.map((e) => (
              <span key={e.name} className="flex items-center gap-1.5">
                <EngineMark engine={e.name} size={14} muted />
                {e.label}
              </span>
            ))}
          </p>
        )}
      </div>
    </Panel>
  );
}

/** Change in the count of checks since the scan before (a count, never a percentage). */
function Delta({ now, before }: { now: number; before: number }) {
  const diff = now - before;
  if (diff === 0) return <Badge tone="sand">Same as last scan</Badge>;
  return <Badge tone={diff > 0 ? "lime" : "alert"}>{diff > 0 ? `${diff} more` : `${-diff} fewer`} than last scan</Badge>;
}

const STATE_TITLE: Record<CellState, string> = {
  you: "names you",
  competitor: "names a competitor instead",
  none: "names neither",
  not_shown: "no AI answer shown",
  error: "no answer",
};

function EngineCard({
  report,
  engine,
  label,
  before,
}: {
  report: Report;
  engine: string;
  label: string;
  before: number | undefined;
}) {
  const s = report.summary[engine];
  const brand = report.product.brand;
  const checks: Check[] = sortChecks(
    report.questions
      .filter((q) => q.kind === "unbranded")
      .map((q) => {
        const state = q.cells[engine]?.state ?? "error";
        return { state, title: `${q.text} (${STATE_TITLE[state]})` };
      })
  );
  const diff = before === undefined ? null : s.unbranded.you - before;

  return (
    <article className="flex flex-col rounded-2xl bg-offwhite p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-[14px] font-medium">
          <EngineMark engine={engine} />
          <span className="truncate">{label}</span>
        </p>
        {diff !== null && diff !== 0 && (
          <span className={cn("text-[12px] font-medium tabular-nums", diff > 0 ? "text-forest" : "text-alert-ink")}>
            {diff > 0 ? `+${diff}` : diff}
          </span>
        )}
      </div>
      <CountOf value={s.unbranded.you} of={s.unbranded.asked} className="mt-4 text-[40px]" />
      <p className="mt-1.5 text-[13px] leading-[1.4] text-stone">unbranded questions name {brand}</p>
      <CheckStrip
        className="mt-3"
        checks={checks}
        label={`${label} names ${brand} in ${s.unbranded.you} of ${s.unbranded.asked} unbranded questions`}
      />
      {s.unbranded.not_shown > 0 && (
        <p className="mt-2 text-[12px] text-taupe">No AI answer shown for {s.unbranded.not_shown}</p>
      )}
      <dl className="mt-4 grid gap-1.5 border-t border-oat/70 pt-3 text-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-stone">Top competitor</dt>
          <dd className="truncate text-right font-medium">
            {s.top_competitor ? (
              <>
                {s.top_competitor.brand}{" "}
                <span className="font-normal text-stone">
                  · {s.top_competitor.count} of {s.unbranded.asked}
                </span>
              </>
            ) : (
              <span className="font-normal text-stone">None named</span>
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-stone">Label conflicts</dt>
          <dd className={cn("font-medium tabular-nums", s.label_conflicts > 0 ? "text-alert-ink" : "text-forest")}>
            {s.label_conflicts}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-stone">All questions</dt>
          <dd className="font-medium tabular-nums">
            {s.all.you} <span className="font-normal text-stone">of {s.all.asked}</span>
          </dd>
        </div>
      </dl>
    </article>
  );
}

// ---- What changed ------------------------------------------------------------------------------------------------------

const PREVIEW_CHANGES = 5;

function WhatChanged({
  report,
  previous,
  tracking,
}: {
  report: Report;
  previous: HistoryRow | undefined;
  tracking: Tracking | undefined;
}) {
  const { base } = useDashboard();
  const [showAll, setShowAll] = useState(false);
  const changes = report.changes;
  const since = previous ? formatDate(previous.finished_at) : null;

  if (changes === null) {
    return (
      <Panel>
        <PanelTitle>What changed since last scan</PanelTitle>
        <div className="mt-4 rounded-2xl bg-offwhite p-5">
          <p className="text-[15px] leading-[1.55] text-graphite">
            This is the first scan of {report.product.brand}. Each weekly scan asks the same questions again, and every
            check that flips shows up here: who AI names, and whether it still contradicts your label.
          </p>
          {tracking && !tracking.weekly && (
            <ArrowLink href={`${base}/tracking`} className="mt-3">
              Turn on weekly scans
            </ArrowLink>
          )}
        </div>
      </Panel>
    );
  }

  const gained = changes.filter((c) => c.after === "you").length;
  const lost = changes.filter((c) => c.before === "you").length;
  const shown = showAll ? changes : changes.slice(0, PREVIEW_CHANGES);

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <PanelTitle>What changed since last scan</PanelTitle>
          {since && <p className="mt-1 text-[13px] text-stone">Compared with the scan of {since}</p>}
        </div>
        {changes.length > 0 && (
          <p className="flex flex-wrap gap-1.5">
            {gained > 0 && <Badge tone="lime">{gained} now name you</Badge>}
            {lost > 0 && <Badge tone="alert">{lost} no longer name you</Badge>}
          </p>
        )}
      </div>
      {changes.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-offwhite p-5 text-[15px] leading-[1.55] text-graphite">
          No check changed. Every question got the same answer state on every engine as last time.
        </p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col">
            {shown.map((c) => (
              <li
                key={`${c.prompt_id}:${c.engine}`}
                className="flex flex-col gap-2 border-t border-oat/60 py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-[12px] text-stone">
                    <EngineMark engine={c.engine} size={14} />
                    {shortEngineLabel(c.engine, reportEngineLabel(report, c.engine))}
                  </p>
                  <p className="mt-1 line-clamp-3 text-[14px] leading-[1.4]">{c.prompt}</p>
                </div>
                <p className="flex shrink-0 items-center gap-1.5">
                  <StatePill state={c.before} />
                  <ArrowRight className="size-3.5 text-taupe" aria-label="became" />
                  <StatePill state={c.after} />
                </p>
              </li>
            ))}
          </ul>
          {changes.length > PREVIEW_CHANGES && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-2 cursor-pointer text-[14px] font-medium text-royal-dark underline-offset-4 hover:underline"
            >
              {showAll ? "Show fewer" : `Show all ${changes.length} changes`}
            </button>
          )}
        </>
      )}
    </Panel>
  );
}

// ---- Label conflicts and next scan ---------------------------------------------------------------------------------------

function LabelConflicts({ report }: { report: Report }) {
  const brand = report.product.brand;
  const byEngine = report.engines
    .map((e) => ({ ...e, n: report.summary[e.name]?.label_conflicts ?? 0 }))
    .filter((e) => e.n > 0);
  const answers = sum(byEngine.map((e) => e.n));
  const statements = report.accuracy_issues.length;
  const high = report.accuracy_issues.filter((i) => i.severity === "high").length;

  if (answers === 0) {
    return (
      <Panel className="flex items-start gap-3 border-lime bg-pass-soft">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-forest" />
        <div>
          <PanelTitle>No label conflicts</PanelTitle>
          <p className="mt-1 text-[14px] leading-[1.5] text-graphite">
            No answer in this scan contradicted {brand}&apos;s FDA label.
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <section aria-labelledby="conflicts-title" className="rounded-2xl border border-alert-line bg-alert-soft p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-alert text-white">
          <TriangleAlert className="size-[18px]" strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p id="conflicts-title" className="font-display text-[20px] leading-[1.2] font-medium text-alert-ink">
            {plural(answers, "answer")} contradict the label
          </p>
          <p className="mt-1 text-[14px] text-graphite">
            {plural(statements, "statement")}
            {high > 0 && `, ${high} high severity`}
          </p>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {byEngine.map((e) => (
          <li key={e.name}>
            <Badge tone="white" className="gap-1.5">
              <EngineMark engine={e.name} size={12} />
              {shortEngineLabel(e.name, e.label)} · {e.n}
            </Badge>
          </li>
        ))}
      </ul>
      <ArrowLink href={`/report/${report.id}`} external className="mt-4 text-alert-ink">
        Compare each with the label
      </ArrowLink>
    </section>
  );
}

/** Weekly tracking status: the next run, or a nudge to turn it on. */
function NextScan({ tracking }: { tracking: Tracking | undefined }) {
  const { base } = useDashboard();
  if (tracking === undefined) return <Skeleton className="h-9 w-56 rounded-full" />;
  if (tracking.weekly && tracking.next_run_at) {
    return (
      <Link
        href={`${base}/tracking`}
        className="inline-flex h-9 items-center gap-2 rounded-full bg-offwhite px-3.5 text-[13px] text-graphite shadow-[0_0_0_1px_var(--color-oat)] transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-royal"
      >
        <CalendarClock className="size-4 text-royal" />
        Next weekly scan <span className="font-medium text-black">{formatDate(tracking.next_run_at)}</span>
      </Link>
    );
  }
  return (
    <Link
      href={`${base}/tracking`}
      className="group inline-flex h-9 items-center gap-2 rounded-full bg-periwinkle/60 px-3.5 text-[13px] text-navy transition-colors hover:bg-periwinkle focus-visible:outline-2 focus-visible:outline-royal"
    >
      <CalendarClock className="size-4" />
      Weekly scans are off
      <span className="font-medium">Turn on</span>
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

// ---- History -------------------------------------------------------------------------------------------------------------

const HISTORY_ROWS = 6;

function HistoryPanel({
  report,
  history,
  tracking,
}: {
  report: Report;
  history: HistoryRow[];
  tracking: Tracking | undefined;
}) {
  const { base } = useDashboard();
  const entries: HistoryEntry[] = history.slice(0, HISTORY_ROWS).map((row, i) => ({
    key: String(row.scan_id),
    date: row.finished_at,
    kind: row.kind,
    status: "done",
    scanId: row.scan_id,
    reportId: row.report_id,
    summary: row.summary,
    changes: i === history.length - 1 ? undefined : row.changes,
  }));

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <PanelTitle>History</PanelTitle>
          <p className="mt-1 text-[14px] text-stone">Unbranded questions that name {report.product.brand}, scan by scan.</p>
        </div>
        <NextScan tracking={tracking} />
      </div>
      <ScanHistory entries={entries} brand={report.product.brand} className="mt-4" />
      {history.length === 1 && (
        <p className="mt-3 text-[13px] text-taupe">Each weekly scan adds a row, so you can see answers move.</p>
      )}
      {history.length > HISTORY_ROWS && (
        <ArrowLink href={`${base}/tracking`} className="mt-3">
          All {history.length} scans
        </ArrowLink>
      )}
    </Panel>
  );
}

// ---- Drafts and links --------------------------------------------------------------------------------------------------------

function LatestDrafts({ drafts, error }: { drafts: DraftSummary[] | undefined; error: string | null }) {
  const { base } = useDashboard();
  return (
    <Panel>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <PanelTitle>Latest drafts</PanelTitle>
        <ArrowLink href={`${base}/content`}>All content</ArrowLink>
      </div>
      {error ? (
        <p className="mt-4 text-[14px] text-alert-ink">{error}</p>
      ) : drafts === undefined ? (
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : drafts.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-offwhite p-5 text-[15px] leading-[1.55] text-graphite">
          No drafts yet. Every fix in the report and every opportunity can become a draft that has passed pre-MLR checks.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {drafts.slice(0, 3).map((d) => (
            <li key={d.id}>
              <Link
                href={`${base}/content/${d.id}`}
                className="group flex flex-col gap-2 rounded-xl bg-offwhite p-4 transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-royal"
              >
                <span className="flex flex-wrap items-center gap-2">
                  <DraftStatusBadge status={d.status} />
                  <span className="text-[12px] text-stone">{plural(d.rounds, "review round")}</span>
                </span>
                <span className="line-clamp-2 text-[15px] leading-[1.4] font-medium group-hover:underline">{d.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Explore({ report }: { report: Report }) {
  const { base } = useDashboard();
  const brand = report.product.brand;
  const lost = report.lost_questions.length;
  const top = report.competitors[0];
  const asked = sum(report.engines.map((e) => report.summary[e.name]?.unbranded.asked ?? 0));
  const gaps = report.sources.competitor_only.length;

  const links = [
    {
      href: `${base}/questions`,
      title: "Where you lose",
      text:
        lost > 0
          ? `${plural(lost, "unbranded question")} where AI names a competitor and not ${brand}.`
          : `Whenever AI named a competitor, it named ${brand} too.`,
    },
    {
      href: `${base}/competitors`,
      title: "Competitors",
      text: top ? `${top.brand} is named in ${top.total} of ${asked} unbranded checks.` : "No competitor was named.",
    },
    {
      href: `${base}/sources`,
      title: "Sources",
      text:
        gaps > 0
          ? `${plural(gaps, "site")} AI cites for competitors and never for ${brand}.`
          : `No site is cited only for competitors.`,
    },
    {
      href: `${base}/opportunities`,
      title: "Opportunities",
      text: "What competitors advertise right now, and an on-label answer to each.",
    },
  ];

  return (
    <Panel className="p-2 md:p-2">
      <ul>
        {links.map((l) => (
          <li key={l.href} className="border-t border-oat/60 first:border-t-0">
            <Link
              href={l.href}
              className="group flex items-center gap-4 rounded-xl px-4 py-4 transition-colors hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-royal"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium">{l.title}</span>
                <span className="mt-0.5 block text-[14px] leading-[1.45] text-stone">{l.text}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-taupe transition-transform group-hover:translate-x-0.5 group-hover:text-black" />
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
