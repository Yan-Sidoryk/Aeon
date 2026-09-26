import { ArrowRight, TriangleAlert } from "lucide-react";
import { plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CellState, Change, Report } from "@/types/api";
import { Panel, SectionTitle } from "../ui";
import { STATE_LABEL, engineLabeler } from "./report-utils";
import { MarkLegend, StateMark } from "./StateMark";

/** 1. "Where AI recommends you": per engine, how many unbranded questions name the brand, question by question. */
export function Visibility({ report }: { report: Report }) {
  const brand = report.product.brand;
  const label = engineLabeler(report);
  const unbranded = report.questions.filter((q) => q.kind === "unbranded");
  const engines = report.engines.map((e) => e.name).filter((name) => report.summary[name]);
  const anyError = engines.some((name) => report.summary[name].unbranded.error > 0);

  return (
    <section aria-labelledby="visibility-title">
      <SectionTitle>
        <span id="visibility-title">Where AI recommends you</span>
      </SectionTitle>
      <p className="mt-1.5 max-w-[720px] text-[15px] leading-[1.5] text-stone">
        {unbranded.length} of the {report.questions.length} questions are unbranded: they name no drug, so AI chooses
        what to recommend. Each square is one of them.
      </p>

      <Panel className="mt-5 p-0 md:p-0">
        <ul>
          {engines.map((name) => {
            const s = report.summary[name];
            const { asked, you, not_shown: notShown, error } = s.unbranded;
            const top = s.top_competitor;
            const engine = s.label || label(name);
            return (
              <li
                key={name}
                className="grid gap-4 border-t border-oat/60 px-5 py-5 first:border-t-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-10 md:px-8 md:py-6"
              >
                <div className="min-w-0">
                  <p className="font-display text-[20px] leading-[1.25] font-medium tracking-[-0.015em] text-balance md:text-[24px]">
                    {engine} names {brand} in{" "}
                    <span className={cn("whitespace-nowrap", you > 0 ? "text-royal-dark" : "text-graphite")}>
                      {you} of {asked}
                    </span>{" "}
                    unbranded questions
                  </p>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[14px] leading-[1.4] text-stone">
                    <span>
                      Top competitor:{" "}
                      {top ? (
                        <>
                          <span className="font-medium text-graphite">{top.brand}</span>, {top.count} of {asked}
                        </>
                      ) : (
                        "none named"
                      )}
                    </span>
                    {notShown > 0 && <span>{notShown} with no AI answer shown</span>}
                    {error > 0 && <span>{error} not answered</span>}
                    {s.label_conflicts > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-alert-ink">
                        <TriangleAlert aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.5} />
                        Contradicts your label on {s.label_conflicts} of {s.all.asked} questions
                      </span>
                    )}
                  </p>
                </div>
                <ol aria-label={`${engine}, question by question`} className="flex flex-wrap gap-1.5">
                  {unbranded.map((q, i) => {
                    const state = q.cells[name]?.state ?? "error";
                    return (
                      <li key={q.id}>
                        <StateMark state={state} label={`${i + 1}. ${q.text}: ${STATE_LABEL[state].toLowerCase()}`} />
                      </li>
                    );
                  })}
                </ol>
              </li>
            );
          })}
        </ul>
      </Panel>
      <MarkLegend brand={brand} showError={anyError} className="mt-3" />
    </section>
  );
}

const PILL: Record<CellState, string> = {
  you: "bg-royal/15 text-royal-dark",
  competitor: "bg-stone/12 text-graphite",
  none: "border border-oat bg-white text-stone",
  not_shown: "border border-dashed border-taupe/70 bg-white text-stone",
  error: "bg-sand text-stone",
};

function StatePill({ state }: { state: CellState }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-medium whitespace-nowrap", PILL[state])}>
      {STATE_LABEL[state]}
    </span>
  );
}

function tone(change: Change): "gain" | "loss" | "neutral" {
  if (change.after === "you") return "gain";
  if (change.before === "you") return "loss";
  return "neutral";
}

/** "What changed since the last scan": the checks that flipped, engine · question · before → after. */
export function Changes({ report }: { report: Report }) {
  const changes = report.changes;
  if (changes === null) return null;
  const label = engineLabeler(report);

  if (changes.length === 0) {
    return (
      <Panel className="flex items-center gap-3 text-[15px] text-graphite">
        <span className="size-2 shrink-0 rounded-full bg-mint-dark" aria-hidden="true" />
        No check changed since the last scan of {report.product.brand}.
      </Panel>
    );
  }

  const brand = report.product.brand;
  const gains = changes.filter((c) => tone(c) === "gain").length;
  const losses = changes.filter((c) => tone(c) === "loss").length;
  const summary = [
    plural(changes.length, "check") + " changed",
    gains > 0 && `${gains} now ${gains === 1 ? "names" : "name"} ${brand}`,
    losses > 0 && `${losses} no longer ${losses === 1 ? "names" : "name"} ${brand}`,
  ].filter(Boolean);

  return (
    <section aria-labelledby="changes-title">
      <SectionTitle>
        <span id="changes-title">What changed since the last scan</span>
      </SectionTitle>
      <p className="mt-1.5 text-[15px] text-stone">{summary.join(" · ")}.</p>
      <Panel className="mt-5 p-0 md:p-0">
        <ul>
          {changes.map((c) => {
            const t = tone(c);
            return (
              <li
                key={`${c.prompt_id}:${c.engine}`}
                className="grid gap-3 border-t border-oat/60 px-5 py-4 first:border-t-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-8 md:px-8"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      t === "gain" && "bg-mint-dark",
                      t === "loss" && "bg-alert",
                      t === "neutral" && "bg-taupe"
                    )}
                  />
                  <p className="min-w-0 text-[15px] leading-[1.45]">
                    <span className="font-medium">{label(c.engine)}</span>
                    <span className="text-stone"> · </span>
                    <span className="text-graphite">“{c.prompt}”</span>
                  </p>
                </div>
                <p className="flex flex-wrap items-center gap-2 pl-5 md:pl-0" aria-label={`Was: ${STATE_LABEL[c.before]}. Now: ${STATE_LABEL[c.after]}.`}>
                  <StatePill state={c.before} />
                  <ArrowRight aria-hidden="true" className="size-4 text-taupe" />
                  <StatePill state={c.after} />
                </p>
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
}
