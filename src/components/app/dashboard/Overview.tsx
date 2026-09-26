"use client";

import { ArrowRight, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { formatDate, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AccuracyIssue, CellState, HistoryRow, Report } from "@/types/api";
import { AnswerSheet, type Selection } from "./AnswerSheet";
import { useDashboard } from "./context";
import { EngineMark, shortEngineLabel } from "./engines";
import { ArrowLink, CountOf, PanelTitle, WithReport } from "./parts";
import { Badge, Panel } from "../ui";

// Every number here is a count of yes/no checks from the latest scan ("2 of 18"), never a score or a percentage.
// A bar is drawn as its checks, one segment each, so its length is always a count.

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

const SEGMENT: Record<CellState, string> = {
  you: "bg-royal",
  competitor: "bg-stone/40",
  none: "bg-white shadow-[inset_0_0_0_1px_var(--color-oat)]",
  not_shown: "bg-sand",
  error: "bg-sand/60",
};
const ORDER: CellState[] = ["you", "competitor", "none", "not_shown", "error"];
// Line colors for the trend, close to each engine's own mark.
const ENGINE_COLOR: Record<string, string> = {
  claude: "#D97757",
  google_aio: "#4285F4",
  google_ai_mode: "#34A853",
};

export function Overview() {
  return <WithReport>{(report) => <OverviewBody report={report} />}</WithReport>;
}

function OverviewBody({ report }: { report: Report }) {
  const { history } = useDashboard();
  const [selected, setSelected] = useState<Selection | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Kpis report={report} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <ByEngine report={report} />
        <WhoAiRecommends report={report} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <WhereYouLose report={report} onOpen={setSelected} />
        <LabelConflicts report={report} onOpen={setSelected} />
      </div>
      <Trend report={report} history={history ?? []} />
      {selected && <AnswerSheet report={report} selection={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ---- Numbers ---------------------------------------------------------------------------------------------------------

function totals(report: Report) {
  const live = report.engines.filter((e) => report.summary[e.name]);
  const unbranded = report.questions.filter((q) => q.kind === "unbranded");
  const conflicts = report.questions.flatMap((q) =>
    live.filter((e) => q.cells[e.name]?.label_conflict).map(() => 1),
  ).length;
  return {
    live,
    unbrandedQuestions: unbranded.length,
    you: sum(live.map((e) => report.summary[e.name].unbranded.you)),
    asked: sum(live.map((e) => report.summary[e.name].unbranded.asked)),
    allYou: sum(live.map((e) => report.summary[e.name].all.you)),
    allAsked: sum(live.map((e) => report.summary[e.name].all.asked)),
    conflicts,
  };
}

function Kpis({ report }: { report: Report }) {
  const t = totals(report);
  const brand = report.product.brand;
  const top = report.competitors[0];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi
        label={`Unbranded checks naming ${brand}`}
        note={`${plural(t.unbrandedQuestions, "question")} × ${plural(t.live.length, "engine")}`}
      >
        <CountOf value={t.you} of={t.asked} className="text-[34px]" />
      </Kpi>
      <Kpi label="All questions" note="Unbranded, branded and comparisons">
        <CountOf value={t.allYou} of={t.allAsked} className="text-[34px]" />
      </Kpi>
      <Kpi
        label="Answers contradicting the label"
        note={
          t.conflicts ? plural(report.accuracy_issues.length, "flagged statement") : "Every answer matched the label"
        }
        alert={t.conflicts > 0}
      >
        <span
          className={cn(
            "font-display text-[34px] leading-none font-medium tabular-nums",
            t.conflicts && "text-alert-ink",
          )}
        >
          {t.conflicts}
        </span>
      </Kpi>
      <Kpi
        label="Named most instead"
        note={top ? `In ${top.total} of ${t.asked} unbranded checks` : "No competitor named"}
      >
        <span className="block truncate font-display text-[30px] leading-none font-medium tracking-[-0.02em]">
          {top?.brand ?? "None"}
        </span>
      </Kpi>
    </div>
  );
}

function Kpi({
  label,
  note,
  alert = false,
  children,
}: {
  label: string;
  note: string;
  alert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Panel className={cn("flex flex-col gap-3 p-5", alert && "border-alert-line bg-alert-soft/60")}>
      <p className={cn("text-[13px] leading-[1.35] font-medium", alert ? "text-alert-ink" : "text-stone")}>{label}</p>
      {children}
      <p className="text-[12px] leading-[1.4] text-taupe">{note}</p>
    </Panel>
  );
}

// ---- By engine -------------------------------------------------------------------------------------------------------

function SegmentBar({ states, label }: { states: CellState[]; label: string }) {
  return (
    <span role="img" aria-label={label} className="flex h-3 w-full gap-[3px]">
      {states.map((state, i) => (
        <span key={i} className={cn("h-full min-w-0 flex-1 rounded-[3px]", SEGMENT[state])} />
      ))}
    </span>
  );
}

function ByEngine({ report }: { report: Report }) {
  const brand = report.product.brand;
  const unbranded = report.questions.filter((q) => q.kind === "unbranded");

  return (
    <Panel className="p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <PanelTitle>By engine</PanelTitle>
        <span className="text-[12px] text-taupe">Unbranded questions · one block per question</span>
      </div>
      <ul className="mt-5 flex flex-col gap-5">
        {report.engines.map((e) => {
          const s = report.summary[e.name];
          if (!s) return null;
          const states = unbranded
            .map((q) => q.cells[e.name]?.state ?? "error")
            .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
          return (
            <li key={e.name}>
              <div className="flex items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 text-[15px] font-medium">
                  <EngineMark engine={e.name} size={18} />
                  <span className="truncate">{e.label}</span>
                </span>
                <span className="shrink-0 text-[14px] tabular-nums">
                  <span className="font-semibold text-royal-dark">{s.unbranded.you}</span>
                  <span className="text-stone">
                    {" "}
                    of {s.unbranded.asked} name {brand}
                  </span>
                </span>
              </div>
              <div className="mt-2.5">
                <SegmentBar
                  states={states}
                  label={`${e.label}: ${s.unbranded.you} of ${s.unbranded.asked} unbranded questions name ${brand}`}
                />
              </div>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-stone">
                <span>
                  All questions{" "}
                  <span className="font-medium text-black tabular-nums">
                    {s.all.you} of {s.all.asked}
                  </span>
                </span>
                {s.top_competitor && (
                  <span>
                    Instead: <span className="font-medium text-black">{s.top_competitor.brand}</span> ×
                    {s.top_competitor.count}
                  </span>
                )}
                {s.label_conflicts > 0 && (
                  <span className="text-alert-ink">{plural(s.label_conflicts, "label conflict")}</span>
                )}
                {s.unbranded.not_shown > 0 && <span>No AI answer shown for {s.unbranded.not_shown}</span>}
              </p>
            </li>
          );
        })}
      </ul>
      <Legend brand={brand} className="mt-6" />
    </Panel>
  );
}

function Legend({ brand, className }: { brand: string; className?: string }) {
  const items: [CellState, string][] = [
    ["you", `Names ${brand}`],
    ["competitor", "Names a competitor"],
    ["none", "Neither"],
    ["not_shown", "No AI answer"],
  ];
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-stone", className)}>
      {items.map(([state, label]) => (
        <li key={state} className="flex items-center gap-1.5">
          <span aria-hidden="true" className={cn("size-2.5 rounded-[3px]", SEGMENT[state])} />
          {label}
        </li>
      ))}
    </ul>
  );
}

// ---- Who AI recommends -----------------------------------------------------------------------------------------------

function WhoAiRecommends({ report }: { report: Report }) {
  const { base } = useDashboard();
  const t = totals(report);
  const rows = [
    { brand: report.product.brand, count: t.you, you: true },
    ...report.competitors.map((c) => ({
      brand: c.brand,
      count: c.total,
      you: false,
    })),
  ]
    .sort((a, b) => b.count - a.count || Number(b.you) - Number(a.you))
    .slice(0, 7);
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Panel className="flex flex-col p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <PanelTitle>Who AI recommends</PanelTitle>
        <span className="text-[12px] text-taupe">of {t.asked} unbranded checks</span>
      </div>
      <ul className="mt-5 flex flex-col gap-3.5">
        {rows.map((r) => (
          <li key={r.brand} className="grid grid-cols-[104px_minmax(0,1fr)_28px] items-center gap-3">
            <span className={cn("truncate text-[14px]", r.you ? "font-semibold text-royal-dark" : "text-graphite")}>
              {r.brand}
            </span>
            <span className="h-6 rounded-md bg-offwhite">
              <span
                className={cn("block h-full rounded-md", r.you ? "bg-royal" : "bg-stone/35")}
                style={{ width: `${(r.count / max) * 100}%` }}
              />
            </span>
            <span className="text-right text-[14px] font-medium tabular-nums">{r.count}</span>
          </li>
        ))}
      </ul>
      <ArrowLink href={`${base}/competitors`} className="mt-auto pt-5">
        Competitors by engine
      </ArrowLink>
    </Panel>
  );
}

// ---- Where you lose --------------------------------------------------------------------------------------------------

function WhereYouLose({ report, onOpen }: { report: Report; onOpen: (s: Selection) => void }) {
  const { base } = useDashboard();
  const lost = report.lost_questions.slice(0, 4);

  return (
    <Panel className="flex flex-col p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <PanelTitle>Where competitors win</PanelTitle>
        <span className="text-[12px] text-taupe">{plural(report.lost_questions.length, "question")}</span>
      </div>
      {lost.length === 0 ? (
        <p className="mt-4 text-[14px] text-stone">
          No unbranded question goes to a competitor instead of {report.product.brand}.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {lost.map((q) => (
            <li key={q.prompt_id} className="border-t border-oat/50 first:border-t-0">
              <button
                type="button"
                onClick={() => onOpen({ promptId: q.prompt_id, engine: q.engines[0] })}
                className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-royal"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] leading-[1.4] font-medium">{q.prompt}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[12px] text-stone">
                    {q.competitors.slice(0, 2).map((c) => (
                      <Badge key={c} className="h-5 px-2 text-[11px]">
                        {c}
                      </Badge>
                    ))}
                    <span>on</span>
                    {q.engines.map((e) => (
                      <EngineMark key={e} engine={e} size={13} />
                    ))}
                  </span>
                </span>
                <span className="shrink-0 text-[12px] font-medium text-royal-dark opacity-0 transition-opacity group-hover:opacity-100">
                  Read answer
                </span>
                <ArrowRight className="size-4 shrink-0 text-taupe" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <ArrowLink href={`${base}/questions`} className="mt-auto pt-4">
        All questions
      </ArrowLink>
    </Panel>
  );
}

// ---- Label conflicts -------------------------------------------------------------------------------------------------

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 } as const;

function LabelConflicts({ report, onOpen }: { report: Report; onOpen: (s: Selection) => void }) {
  const { base } = useDashboard();
  // One row per answer (question × engine), its most severe statement first.
  const byCell = new Map<string, AccuracyIssue>();
  for (const issue of [...report.accuracy_issues].sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  )) {
    const key = `${issue.prompt_id}:${issue.engine}`;
    if (!byCell.has(key)) byCell.set(key, issue);
  }
  const rows = [...byCell.values()].slice(0, 4);

  return (
    <Panel className={cn("flex flex-col p-5 md:p-6", rows.length > 0 && "border-alert-line")}>
      <div className="flex items-baseline justify-between gap-3">
        <PanelTitle className={cn(rows.length > 0 && "text-alert-ink")}>Label conflicts</PanelTitle>
        <span className="text-[12px] text-taupe">{plural(byCell.size, "answer")}</span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-4 text-[14px] text-stone">No answer contradicts the {report.product.brand} FDA label.</p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {rows.map((issue) => (
            <li key={`${issue.prompt_id}:${issue.engine}`} className="border-t border-oat/50 first:border-t-0">
              <button
                type="button"
                onClick={() => onOpen({ promptId: issue.prompt_id, engine: issue.engine })}
                className="flex w-full cursor-pointer items-start gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-alert-soft/50 focus-visible:outline-2 focus-visible:outline-royal"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-alert" strokeWidth={2.25} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[14px] leading-[1.45]">“{issue.ai_sentence}”</span>
                  <span className="mt-1 flex items-center gap-1.5 text-[12px] text-stone">
                    <EngineMark engine={issue.engine} size={13} />
                    <span className="truncate">{issue.prompt}</span>
                  </span>
                </span>
                {issue.severity === "high" && (
                  <Badge tone="alert" className="h-5 px-2 text-[11px]">
                    High
                  </Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
      <ArrowLink href={`${base}/questions`} className="mt-auto pt-4">
        Compare each with the label
      </ArrowLink>
    </Panel>
  );
}

// ---- Trend -----------------------------------------------------------------------------------------------------------

function Trend({ report, history }: { report: Report; history: HistoryRow[] }) {
  const scans = [...history].reverse(); // oldest first
  const brand = report.product.brand;
  const engines = report.engines.filter((e) => scans.some((h) => h.summary[e.name]));
  const max = Math.max(1, ...scans.flatMap((h) => engines.map((e) => h.summary[e.name]?.unbranded.asked ?? 0)));

  if (scans.length < 2) {
    return (
      <Panel className="flex flex-wrap items-center justify-between gap-3 p-5 md:px-6">
        <p className="text-[14px] text-stone">
          <span className="font-medium text-black">Trend</span> · the first scan was {formatDate(report.created_at)}.
          Each scan adds a point, so you see where AI moves toward or away from {brand}.
        </p>
        <span className="text-[12px] text-taupe">Turn on weekly scans in the sidebar</span>
      </Panel>
    );
  }

  const W = 640;
  const H = 180;
  const PAD = { l: 28, r: 12, t: 12, b: 26 };
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / (scans.length - 1);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);

  return (
    <Panel className="p-5 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <PanelTitle>Unbranded checks naming {brand}, scan by scan</PanelTitle>
        <ul className="flex flex-wrap gap-3 text-[12px] text-stone">
          {engines.map((e) => (
            <li key={e.name} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: ENGINE_COLOR[e.name] ?? "#6b7280" }} />
              {shortEngineLabel(e.name, e.label)}
            </li>
          ))}
        </ul>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-4 h-auto w-full"
        role="img"
        aria-label={`Trend over ${scans.length} scans`}
      >
        {[0, max].map((v) => (
          <g key={v}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-oat)"
              strokeDasharray={v ? "3 4" : undefined}
            />
            <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" className="fill-taupe text-[11px]">
              {v}
            </text>
          </g>
        ))}
        {scans.map((h, i) => (
          <text key={h.scan_id} x={x(i)} y={H - 6} textAnchor="middle" className="fill-taupe text-[11px]">
            {formatDate(h.finished_at)}
          </text>
        ))}
        {engines.map((e) => {
          const color = ENGINE_COLOR[e.name] ?? "#6b7280";
          const points = scans.map((h, i) => [x(i), y(h.summary[e.name]?.unbranded.you ?? 0)] as const);
          return (
            <g key={e.name}>
              <polyline
                points={points.map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={2.25}
                strokeLinejoin="round"
              />
              {points.map(([px, py], i) => (
                <circle key={i} cx={px} cy={py} r={3.5} fill="white" stroke={color} strokeWidth={2} />
              ))}
            </g>
          );
        })}
      </svg>
    </Panel>
  );
}
