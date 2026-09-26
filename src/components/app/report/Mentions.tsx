import { cn } from "@/lib/utils";
import type { Report } from "@/types/api";
import { Badge, SectionTitle } from "../ui";
import { engineLabeler } from "./report-utils";

/** "Everyone's mentions": each drug × engine, counted on unbranded questions (where AI picks the drug). */
export function Mentions({ report }: { report: Report }) {
  const label = engineLabeler(report);
  const engines = report.engines.map((e) => e.name).filter((name) => report.summary[name]);
  const asked = Object.fromEntries(engines.map((e) => [e, report.summary[e].unbranded.asked]));
  const askedTotal = engines.reduce((n, e) => n + asked[e], 0);
  const ours = Object.fromEntries(engines.map((e) => [e, report.summary[e].unbranded.you]));

  const rows = [
    { brand: report.product.brand, byEngine: ours, total: engines.reduce((n, e) => n + ours[e], 0), you: true },
    ...report.competitors.map((c) => ({ brand: c.brand, byEngine: c.by_engine, total: c.total, you: false })),
  ].sort((a, b) => b.total - a.total || Number(b.you) - Number(a.you));
  const unbranded = report.questions.filter((q) => q.kind === "unbranded").length;

  return (
    <section aria-labelledby="mentions-title">
      <SectionTitle>
        <span id="mentions-title">Everyone&apos;s mentions</span>
      </SectionTitle>
      <p className="mt-1.5 text-[15px] text-stone">
        How many of the {unbranded} unbranded questions name each drug, engine by engine.
      </p>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-oat/70 bg-white">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="text-[13px] text-stone">
              <th scope="col" className="sticky left-0 z-10 bg-white px-4 py-3 font-medium md:px-6">
                Drug
              </th>
              {engines.map((e) => (
                <th key={e} scope="col" className="px-3 py-3 font-medium">
                  {label(e)}
                </th>
              ))}
              <th scope="col" className="px-3 py-3 font-medium md:pr-6">
                All engines
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.brand} className={cn("border-t border-oat/50", row.you && "bg-royal/4")}>
                <th
                  scope="row"
                  className={cn("sticky left-0 z-10 px-4 py-3 text-[15px] font-medium md:px-6", row.you ? "bg-[#f8f9ff] text-royal-dark" : "bg-white")}
                >
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    {row.brand}
                    {row.you && <Badge tone="royal">You</Badge>}
                  </span>
                </th>
                {engines.map((e) => (
                  <td key={e} className="px-3 py-3">
                    <Count n={row.byEngine[e] ?? 0} of={asked[e]} you={row.you} />
                  </td>
                ))}
                <td className="px-3 py-3 md:pr-6">
                  <Count n={row.total} of={askedTotal} you={row.you} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Count({ n, of, you }: { n: number; of: number; you: boolean }) {
  return (
    <span className="whitespace-nowrap">
      <span className={cn("font-display text-[18px] font-medium tabular-nums", n === 0 ? "text-taupe" : you ? "text-royal-dark" : "text-black")}>
        {n}
      </span>
      <span className="text-[13px] text-taupe"> of {of}</span>
    </span>
  );
}
