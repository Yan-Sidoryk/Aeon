"use client";

import { useState } from "react";
import { AUDIENCE_SINGULAR, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CellState, Report } from "@/types/api";
import { Badge, Panel } from "../ui";
import { AnswerSheet, type Selection } from "./AnswerSheet";
import { CheckStrip, type Check } from "./checks";
import { EngineMark, shortEngineLabel } from "./engines";
import { PageHeading, PanelTitle, WithReport } from "./parts";

/** Competitors: who AI names on unbranded questions, per engine, and the sites it cites for each of them. */
export function CompetitorsView() {
  return <WithReport>{(report) => <Competitors report={report} />}</WithReport>;
}

function strip(named: number, asked: number, state: CellState): Check[] {
  return [
    ...Array.from({ length: named }, () => ({ state })),
    ...Array.from({ length: Math.max(asked - named, 0) }, (): Check => ({ state: "none" })),
  ];
}

function Competitors({ report }: { report: Report }) {
  const [selected, setSelected] = useState<Selection | null>(null);
  const brand = report.product.brand;
  const engines = report.engines.filter((e) => report.summary[e.name]);
  const asked = (engine: string) => report.summary[engine]?.unbranded.asked ?? 0;
  const totalAsked = engines.reduce((n, e) => n + asked(e.name), 0);

  const rows = [
    {
      brand,
      you: true,
      byEngine: Object.fromEntries(engines.map((e) => [e.name, report.summary[e.name].unbranded.you])),
    },
    ...report.competitors.map((c) => ({ brand: c.brand, you: false, byEngine: c.by_engine })),
  ].map((r) => ({ ...r, total: engines.reduce((n, e) => n + (r.byEngine[e.name] ?? 0), 0) }));
  const [you, ...others] = rows;
  const rivals = [...others].sort((a, b) => b.total - a.total);
  const ranked = [you, ...rivals];

  return (
    <div className="flex flex-col gap-4">
      <PageHeading
        title="Competitors"
        description={`Who AI names when a question doesn't name any drug, on which engine, and the sites it cites when it names them. ${brand} is on top for comparison.`}
      />

      <Panel className="mt-2 p-0 md:p-0">
        <div className="px-5 pt-5 md:px-6 md:pt-6">
          <PanelTitle>Named on unbranded questions</PanelTitle>
          <p className="mt-1 text-[14px] text-stone">
            One square per question. A filled square: that engine&apos;s answer names the drug.
          </p>
        </div>
        <div className="relative mt-4 overflow-x-auto border-t border-oat/70">
          <table className="w-full border-collapse text-left md:min-w-[680px]">
            <thead>
              <tr className="text-[13px] text-stone">
                <th scope="col" className="sticky left-0 z-10 bg-white py-3 pr-2 pl-4 font-medium md:px-6">
                  Drug
                </th>
                {engines.map((e) => (
                  <th key={e.name} scope="col" className="px-2 py-3 align-bottom font-medium md:px-3" title={e.label}>
                    <span className="flex flex-col items-start gap-1 whitespace-nowrap md:flex-row md:items-center md:gap-1.5">
                      <EngineMark engine={e.name} size={14} />
                      <span className="text-[11px] md:hidden">{shortEngineLabel(e.name, e.label).replace(/^AI Overviews$/, "Overviews")}</span>
                      <span className="hidden md:inline">{shortEngineLabel(e.name, e.label)}</span>
                    </span>
                  </th>
                ))}
                <th scope="col" className="py-3 pr-4 pl-2 text-right font-medium whitespace-nowrap md:px-6">
                  <span className="md:hidden">All</span>
                  <span className="hidden md:inline">All engines</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row) => (
                <tr key={row.brand} className={cn("border-t border-oat/50", row.you && "bg-royal/[0.04]")}>
                  <th
                    scope="row"
                    className={cn(
                      "sticky left-0 z-10 py-3.5 pr-2 pl-4 text-[15px] font-medium md:px-6",
                      row.you ? "bg-[#f7f9ff]" : "bg-white"
                    )}
                  >
                    <span className="flex items-center gap-2 whitespace-nowrap">
                      {row.brand}
                      {row.you && (
                        <Badge tone="royal" className="hidden h-5 px-2 text-[11px] sm:inline-flex">
                          You
                        </Badge>
                      )}
                    </span>
                  </th>
                  {engines.map((e) => {
                    const n = row.byEngine[e.name] ?? 0;
                    return (
                      <td key={e.name} className="px-2 py-3.5 md:px-3">
                        <span className="flex flex-col gap-1.5">
                          <span className="text-[14px] whitespace-nowrap tabular-nums">
                            <span className={cn("font-medium", row.you ? "text-royal-dark" : "text-black")}>{n}</span>
                            <span className="text-stone"> of {asked(e.name)}</span>
                          </span>
                          <CheckStrip
                            size="sm"
                            className="hidden md:flex"
                            checks={strip(n, asked(e.name), row.you ? "you" : "competitor")}
                            label={`${e.label} names ${row.brand} in ${n} of ${asked(e.name)} unbranded questions`}
                          />
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-3.5 pr-4 pl-2 text-right text-[14px] whitespace-nowrap tabular-nums md:px-6">
                    <span className={cn("font-display text-[18px] font-medium", row.you && "text-royal-dark")}>{row.total}</span>
                    <span className="text-stone">
                      <span className="md:hidden">/</span>
                      <span className="hidden md:inline"> of </span>
                      {totalAsked}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <LostQuestions report={report} onOpen={setSelected} />

      <section aria-labelledby="cited-title" className="mt-4">
        <h3 id="cited-title" className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.01em]">
          What AI cites for each competitor
        </h3>
        <p className="mt-1 text-[14px] text-stone">
          The sites most often cited in answers that name them, by number of answers. Sites marked “Not cited for you”
          never back an answer that names {brand}: that&apos;s where to get accurate, on-label content placed.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rivals.map((row) => (
            <CompetitorCard key={row.brand} report={report} brand={row.brand} total={row.total} of={totalAsked} />
          ))}
        </div>
      </section>

      {selected && <AnswerSheet report={report} selection={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function LostQuestions({ report, onOpen }: { report: Report; onOpen: (s: Selection) => void }) {
  const brand = report.product.brand;
  const lost = report.lost_questions;
  return (
    <Panel>
      <PanelTitle>Where they&apos;re named and {brand} isn&apos;t</PanelTitle>
      <p className="mt-1 text-[14px] text-stone">Unbranded questions where an engine recommends a competitor and not you.</p>
      {lost.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-pass-soft p-5 text-[15px] text-forest">
          Whenever AI named a competitor, it named {brand} too.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col">
          {lost.map((q) => (
            <li
              key={q.prompt_id}
              className="grid gap-3 border-t border-oat/60 py-4 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6"
            >
              <div className="min-w-0">
                <p className="text-[15px] leading-[1.4] font-medium">“{q.prompt}”</p>
                <p className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[12px] text-stone">{AUDIENCE_SINGULAR[q.audience]} · recommended instead</span>
                  {q.competitors.map((c) => (
                    <Badge key={c} className="bg-stone/12">
                      {c}
                    </Badge>
                  ))}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 md:justify-end">
                {q.engines.map((engine) => (
                  <button
                    key={engine}
                    type="button"
                    onClick={() => onOpen({ promptId: q.prompt_id, engine })}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 text-[13px] font-medium shadow-[0_0_0_1px_var(--color-oat)] transition-colors hover:bg-sand focus-visible:outline-2 focus-visible:outline-royal"
                  >
                    <EngineMark engine={engine} size={14} />
                    Read {shortEngineLabel(engine, report.engines.find((e) => e.name === engine)?.label)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function CompetitorCard({ report, brand, total, of }: { report: Report; brand: string; total: number; of: number }) {
  const sources = [...(report.sources.by_competitor[brand] ?? [])].sort((a, b) => b.citations - a.citations);
  const gaps = new Set(report.sources.competitor_only.map((s) => s.domain));

  return (
    <article className="flex flex-col rounded-2xl border border-oat/70 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="min-w-0 truncate font-display text-[20px] leading-tight font-medium">{brand}</h4>
        <p className="shrink-0 text-[13px] text-stone tabular-nums">
          Named in <span className="font-medium text-black">{total}</span> of {of}
        </p>
      </div>
      {sources.length === 0 ? (
        <p className="mt-4 text-[14px] text-stone">No sources were cited in answers that name {brand}.</p>
      ) : (
        <ol className="mt-3 flex flex-col">
          {sources.map((s) => (
            <li key={s.domain} className="flex items-baseline justify-between gap-3 border-t border-oat/50 py-2 text-[14px] first:border-t-0">
              <span className="flex min-w-0 items-baseline gap-2">
                <a
                  href={`https://${s.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 truncate font-medium underline-offset-4 hover:underline"
                >
                  {s.domain}
                </a>
                {gaps.has(s.domain) && (
                  <span className="shrink-0 rounded-full bg-flame/12 px-1.5 py-0.5 text-[11px] leading-none font-medium text-[#a84300]">
                    Not cited for you
                  </span>
                )}
              </span>
              <span className="shrink-0 text-[13px] text-stone tabular-nums">{plural(s.citations, "answer")}</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
