import { ExternalLink } from "lucide-react";
import { plural } from "@/lib/format";
import type { Report, SourceRow } from "@/types/api";
import { Badge, Panel, SectionTitle } from "../ui";
import { engineLabeler } from "./report-utils";

function DomainLink({ domain }: { domain: string }) {
  return (
    <a
      href={`https://${domain}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex max-w-full min-w-0 items-center gap-1.5 text-[16px] font-medium underline-offset-4 hover:underline"
    >
      <span className="truncate">{domain}</span>
      <ExternalLink className="size-3.5 shrink-0 text-stone" aria-hidden="true" />
    </a>
  );
}

/** 4. "Why": the sites AI cites. Cited only for competitors, cited in answers that name you, and per competitor. */
export function Sources({ report }: { report: Report }) {
  const brand = report.product.brand;
  const label = engineLabeler(report);
  const { competitor_only: competitorOnly, yours, by_competitor: byCompetitor } = report.sources;
  // Competitors in the order of how often AI names them.
  const rivals = [
    ...report.competitors.map((c) => c.brand).filter((b) => byCompetitor[b]?.length),
    ...Object.keys(byCompetitor).filter((b) => !report.competitors.some((c) => c.brand === b)),
  ];

  return (
    <section aria-labelledby="sources-title">
      <SectionTitle>
        <span id="sources-title">Why: the sources AI cites</span>
      </SectionTitle>
      <p className="mt-1.5 max-w-[720px] text-[15px] leading-[1.5] text-stone">
        AI answers lean on the sites they cite. These are cited in answers that recommend a competitor and never in an
        answer that names {brand}: the places to get accurate, on-label content in front of AI.
      </p>

      {competitorOnly.length === 0 ? (
        <Panel className="mt-5 text-[15px]">Every site cited for a competitor was also cited in an answer that names {brand}.</Panel>
      ) : (
        <Panel className="mt-5 p-0 md:p-0">
          <ul>
            {competitorOnly.map((s) => (
              <SourceItem key={s.domain} source={s} engines={s.engines.map(label)} />
            ))}
          </ul>
        </Panel>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <Panel>
          <h3 className="font-display text-[18px] leading-tight font-medium">Sources that cite you</h3>
          <p className="mt-1 text-[14px] leading-[1.45] text-stone">Sites cited in answers that name {brand}, besides your own.</p>
          {yours.length === 0 ? (
            <p className="mt-4 text-[15px] text-graphite">No answer that names {brand} cited a source.</p>
          ) : (
            <ul className="mt-4 flex flex-col">
              {yours.map((s) => (
                <li key={s.domain} className="flex items-center justify-between gap-3 border-t border-oat/60 py-2.5 first:border-t-0">
                  <DomainLink domain={s.domain} />
                  <span className="shrink-0 text-[13px] text-stone">
                    {plural(s.citations, "citation")} · {plural(s.engines.length, "engine")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {rivals.length > 0 && (
          <Panel>
            <h3 className="font-display text-[18px] leading-tight font-medium">Top sources per competitor</h3>
            <p className="mt-1 text-[14px] leading-[1.45] text-stone">Citations in answers that name each competitor.</p>
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-5 md:gap-x-6">
              {rivals.map((rival) => (
                <div key={rival} className="min-w-0">
                  <Badge className="bg-stone/12">{rival}</Badge>
                  <ol className="mt-2 flex flex-col gap-1">
                    {[...byCompetitor[rival]]
                      .sort((a, b) => b.citations - a.citations)
                      .map((s) => (
                        <li key={s.domain} className="flex items-baseline justify-between gap-2 text-[13px] leading-[1.4] md:gap-3 md:text-[14px]">
                          <span className="truncate text-graphite">{s.domain}</span>
                          <span className="shrink-0 text-[13px] text-taupe tabular-nums">{s.citations}</span>
                        </li>
                      ))}
                  </ol>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </section>
  );
}

function SourceItem({ source, engines }: { source: SourceRow; engines: string[] }) {
  const example = source.questions[0];
  return (
    <li className="grid gap-3 border-t border-oat/60 px-5 py-4 first:border-t-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:gap-8 md:px-6">
      <div className="min-w-0">
        <DomainLink domain={source.domain} />
        <p className="mt-1 text-[13px] leading-[1.4] text-stone">
          {plural(source.citations, "citation")} · {engines.join(", ")}
        </p>
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap gap-1.5">
          {source.competitors.map((c) => (
            <Badge key={c} className="bg-stone/12">
              {c}
            </Badge>
          ))}
        </div>
        {example && <p className="mt-2 text-[13px] leading-[1.45] text-stone">For example: “{example}”</p>}
      </div>
    </li>
  );
}
