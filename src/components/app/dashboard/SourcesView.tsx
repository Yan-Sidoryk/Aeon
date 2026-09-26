"use client";

import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { plural } from "@/lib/format";
import type { Report, SourceRow } from "@/types/api";
import { Badge } from "../ui";
import { EngineMark, shortEngineLabel } from "./engines";
import { PageHeading, WithReport } from "./parts";

/** Sources: the domains AI cites, split into "only for competitors" (where to get content placed) and "for you". */
export function SourcesView() {
  return <WithReport>{(report) => <Sources report={report} />}</WithReport>;
}

function Sources({ report }: { report: Report }) {
  const brand = report.product.brand;
  const { competitor_only: gaps, yours } = report.sources;

  return (
    <div className="flex flex-col gap-10">
      <PageHeading
        title="Sources"
        description={`The sites AI cites in its answers. Sites it cites for competitors and never for ${brand} are where accurate, on-label content does the most.`}
      />

      <SourceSection
        id="gaps"
        title={`Cited for competitors, never for ${brand}`}
        tone="gap"
        description={`Cited in answers that name a competitor, and in no answer that names ${brand}. Start here: get content placed, or corrected, on these sites.`}
        rows={gaps}
        report={report}
        empty={`No site was cited only for competitors. Every site AI cited for them was cited for ${brand} too.`}
      />

      <SourceSection
        id="yours"
        title={`Cited when AI names ${brand}`}
        tone="yours"
        description={`Sites behind the answers that name ${brand}. Keep them accurate: AI repeats what they say.`}
        rows={yours}
        report={report}
        empty={`No answer that names ${brand} cited a source.`}
      />

      <p className="text-[13px] leading-[1.5] text-taupe">
        Your own sites are left out of both lists. A site counts once per answer that cites it.
      </p>
    </div>
  );
}

function SourceSection({
  id,
  title,
  tone,
  description,
  rows,
  report,
  empty,
}: {
  id: string;
  title: string;
  tone: "gap" | "yours";
  description: string;
  rows: SourceRow[];
  report: Report;
  empty: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 id={`${id}-title`} className="font-display text-[20px] leading-[1.2] font-medium tracking-[-0.01em]">
          {title}
        </h3>
        <Badge tone={tone === "gap" ? "flame" : "lime"}>{plural(rows.length, "site")}</Badge>
      </div>
      <p className="mt-1.5 max-w-[680px] text-[14px] leading-[1.5] text-stone">{description}</p>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-oat/70 bg-white p-5 text-[15px] text-graphite">{empty}</p>
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-2 md:hidden">
            {rows.map((row) => (
              <li key={row.domain} className="rounded-2xl border border-oat/70 bg-white p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <SiteLink domain={row.domain} />
                  <CitedIn n={row.citations} />
                </div>
                <div className="mt-3 flex flex-col gap-2.5 border-t border-oat/60 pt-3">
                  <Field label="Engines">
                    <EngineList engines={row.engines} report={report} inline />
                  </Field>
                  {row.competitors.length > 0 && (
                    <Field label="Competitors named">
                      <CompetitorBadges names={row.competitors} />
                    </Field>
                  )}
                  {row.questions[0] && (
                    <Field label="Example question">
                      <ExampleQuestion questions={row.questions} />
                    </Field>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="relative mt-4 hidden overflow-x-auto rounded-2xl border border-oat/70 bg-white md:block">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="text-[13px] whitespace-nowrap text-stone">
                  <th scope="col" className="w-[26%] px-5 py-3 font-medium">
                    Site
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Cited in
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Engines
                  </th>
                  <th scope="col" className="w-[22%] px-3 py-3 font-medium">
                    Competitors named
                  </th>
                  <th scope="col" className="w-[30%] px-5 py-3 font-medium">
                    Example question
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.domain} className="border-t border-oat/50 align-top">
                    <th scope="row" className="max-w-[240px] px-5 py-4 font-normal">
                      <SiteLink domain={row.domain} />
                    </th>
                    <td className="px-3 py-4">
                      <CitedIn n={row.citations} />
                    </td>
                    <td className="px-3 py-4">
                      <EngineList engines={row.engines} report={report} />
                    </td>
                    <td className="px-3 py-4">
                      {row.competitors.length === 0 ? (
                        <span className="text-[13px] text-taupe">None</span>
                      ) : (
                        <CompetitorBadges names={row.competitors} />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {row.questions[0] ? <ExampleQuestion questions={row.questions} /> : <span className="text-taupe">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[12px] text-stone">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function SiteLink({ domain }: { domain: string }) {
  return (
    <a
      href={`https://${domain}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative inline-flex max-w-full min-w-0 items-center gap-1.5 text-[15px] font-medium underline-offset-4 hover:underline"
    >
      <span className="truncate">{domain}</span>
      <ExternalLink className="size-3.5 shrink-0 text-stone" aria-hidden="true" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

function CitedIn({ n }: { n: number }) {
  return (
    <span className="shrink-0 text-[14px] whitespace-nowrap tabular-nums">
      <span className="font-medium">{n}</span> <span className="text-stone">{n === 1 ? "answer" : "answers"}</span>
    </span>
  );
}

function EngineList({ engines, report, inline = false }: { engines: string[]; report: Report; inline?: boolean }) {
  return (
    <ul className={inline ? "flex flex-wrap gap-x-3 gap-y-1" : "flex flex-col gap-1"}>
      {engines.map((engine) => (
        <li key={engine} className="flex items-center gap-1.5 text-[13px] whitespace-nowrap">
          <EngineMark engine={engine} size={14} />
          {shortEngineLabel(engine, report.engines.find((e) => e.name === engine)?.label)}
        </li>
      ))}
    </ul>
  );
}

function CompetitorBadges({ names }: { names: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {names.map((c) => (
        <Badge key={c} className="h-5 bg-stone/12 px-2 text-[11px]">
          {c}
        </Badge>
      ))}
    </span>
  );
}

function ExampleQuestion({ questions }: { questions: string[] }) {
  return (
    <span className="block text-[13px] leading-[1.45] text-graphite">
      <span className="line-clamp-2">“{questions[0]}”</span>
      {questions.length > 1 && (
        <span className="mt-1 block text-[12px] text-taupe">+{plural(questions.length - 1, "more question")}</span>
      )}
    </span>
  );
}
