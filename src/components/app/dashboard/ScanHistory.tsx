import Link from "next/link";
import { formatDate, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EngineSummary, Scan } from "@/types/api";
import { Badge } from "../ui";
import { CheckStrip, tallyChecks } from "./checks";
import { EngineMark, shortEngineLabel } from "./engines";

export type HistoryEntry = {
  key: string;
  date: string;
  kind: Scan["kind"];
  status: Scan["status"];
  scanId: number;
  reportId?: string | null;
  summary?: Record<string, EngineSummary>;
  /** Checks that flipped since the scan before; undefined on the first scan. */
  changes?: number;
};

/** "onboarding" scans are the ones someone started (the first report, or "Run scan now"). */
export const SCAN_KIND_LABEL: Record<Scan["kind"], string> = { onboarding: "On demand", weekly: "Weekly" };

type Engine = { name: string; label: string };

/**
 * One row per scan: its date and, per engine, how many unbranded questions named the drug ("4 of 6"), drawn as
 * checks so weeks line up under each other. A table from tablet width, stacked cards on phones.
 */
export function ScanHistory({ entries, brand, className }: { entries: HistoryEntry[]; brand: string; className?: string }) {
  const engines: Engine[] = [];
  for (const entry of entries) {
    for (const [name, s] of Object.entries(entry.summary ?? {})) {
      if (!engines.some((e) => e.name === name)) engines.push({ name, label: s.label });
    }
  }

  return (
    <div className={className}>
      <ul className="flex flex-col gap-2 md:hidden">
        {entries.map((entry) => (
          <li key={entry.key} className="rounded-2xl border border-oat/70 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <ScanWhen entry={entry} />
              <ScanLink entry={entry} />
            </div>
            {entry.summary && (
              <ul className="mt-3 flex flex-col gap-2 border-t border-oat/60 pt-3">
                {engines.map((e) => {
                  const s = entry.summary?.[e.name];
                  return (
                    <li key={e.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                      <span className="flex min-w-0 items-center gap-2 text-[14px]">
                        <EngineMark engine={e.name} size={14} />
                        <span className="truncate">{shortEngineLabel(e.name, e.label)}</span>
                      </span>
                      {s ? <EngineCount engine={e} summary={s} brand={brand} inline /> : <span className="text-taupe">—</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-[13px] text-stone">
              <ChangedText entry={entry} />
            </p>
          </li>
        ))}
      </ul>

      <div className="relative hidden overflow-x-auto rounded-2xl border border-oat/70 bg-white md:block">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="text-[13px] text-stone">
              <th scope="col" className="px-4 py-3 font-medium md:px-5">
                Scan
              </th>
              {engines.map((e) => (
                <th key={e.name} scope="col" className="px-3 py-3 font-medium">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <EngineMark engine={e.name} size={14} />
                    {shortEngineLabel(e.name, e.label)}
                  </span>
                </th>
              ))}
              <th scope="col" className="px-3 py-3 font-medium">
                Changed
              </th>
              <th scope="col" className="px-4 py-3 md:px-5">
                <span className="sr-only">Report</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.key} className="border-t border-oat/50 align-middle">
                <th scope="row" className="px-4 py-3.5 font-normal md:px-5">
                  <ScanWhen entry={entry} />
                </th>
                {engines.map((e) => {
                  const s = entry.summary?.[e.name];
                  return (
                    <td key={e.name} className="px-3 py-3.5">
                      {s ? <EngineCount engine={e} summary={s} brand={brand} /> : <span className="text-[14px] text-taupe">—</span>}
                    </td>
                  );
                })}
                <td className="px-3 py-3.5 text-[14px] whitespace-nowrap text-stone">
                  <ChangedText entry={entry} />
                </td>
                <td className="px-4 py-3.5 text-right md:px-5">
                  <ScanLink entry={entry} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScanWhen({ entry }: { entry: HistoryEntry }) {
  return (
    <span className="block">
      <span className="block text-[15px] font-medium whitespace-nowrap">{formatDate(entry.date)}</span>
      <span className="mt-1 flex items-center gap-1.5">
        <Badge tone="white" className="h-5 px-2 text-[11px]">
          {SCAN_KIND_LABEL[entry.kind]}
        </Badge>
        {entry.status === "running" && (
          <Badge tone="periwinkle" className="h-5 px-2 text-[11px]">
            Running
          </Badge>
        )}
        {entry.status === "failed" && (
          <Badge tone="alert" className="h-5 px-2 text-[11px]">
            Failed
          </Badge>
        )}
      </span>
    </span>
  );
}

function EngineCount({ engine, summary, brand, inline = false }: { engine: Engine; summary: EngineSummary; brand: string; inline?: boolean }) {
  const { you, asked } = summary.unbranded;
  return (
    <span className={cn("flex gap-1.5", inline ? "flex-row-reverse items-center gap-2.5" : "flex-col")}>
      <span className="text-[14px] whitespace-nowrap tabular-nums">
        <span className="font-medium text-royal-dark">{you}</span>
        <span className="text-stone"> of {asked}</span>
      </span>
      <CheckStrip
        size="sm"
        className="flex-nowrap"
        checks={tallyChecks(summary.unbranded)}
        label={`${engine.label} named ${brand} in ${you} of ${asked} unbranded questions`}
      />
    </span>
  );
}

function ChangedText({ entry }: { entry: HistoryEntry }) {
  if (entry.status !== "done") return <>—</>;
  if (entry.changes === undefined) return <>First scan</>;
  if (entry.changes === 0) return <>No check changed</>;
  return <>{plural(entry.changes, "check")} changed</>;
}

function ScanLink({ entry }: { entry: HistoryEntry }) {
  const classes = "text-[14px] font-medium whitespace-nowrap text-royal-dark underline-offset-4 hover:underline";
  if (entry.status === "running") {
    return (
      <Link href={`/start/scan?scan=${entry.scanId}`} className={classes}>
        Watch live
      </Link>
    );
  }
  if (!entry.reportId) return null;
  return (
    <a href={`/report/${entry.reportId}`} target="_blank" rel="noopener noreferrer" className={cn(classes, "relative")}>
      Report ↗<span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
