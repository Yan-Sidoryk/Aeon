"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { useJobStream } from "@/hooks/useJobStream";
import { api, errorMessage } from "@/lib/api";
import { AUDIENCE_SINGULAR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CellEvent, Engine, Prompt, ScanCounters, ScanEvents } from "@/types/api";
import { AnswerCell, AnswerLegend } from "./AnswerCell";
import { ErrorNote, Eyebrow, Lead, PageTitle, Panel, Screen, Skeleton } from "./ui";

const cellKey = (promptId: number, engine: string) => `${promptId}:${engine}`;

/** Screen 5, live scan: the prompt × engine grid fills as answers arrive, then we open the report. */
export function ScanScreen({ scanId }: { scanId: number }) {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);
  const [engines, setEngines] = useState<Engine[]>([]);
  const [scanned, setScanned] = useState<string[]>([]);
  const [cells, setCells] = useState<Record<string, CellEvent>>({});
  const [counters, setCounters] = useState<ScanCounters | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const scan = await api.scan(scanId);
        const [setup, allEngines, product] = await Promise.all([
          api.setup(scan.product_id),
          api.engines(),
          api.product(scan.product_id),
        ]);
        if (cancelled) return;
        setBrand(product.brand);
        setPrompts(setup.prompts);
        setScanned(scan.engines);
        // Scanned engines first, so the live columns are on screen on a phone; "coming soon" ones last.
        setEngines([...allEngines].sort((a, b) => Number(scan.engines.includes(b.name)) - Number(scan.engines.includes(a.name))));
        if (scan.status === "failed") setError("This scan failed. Go back and run it again.");
        if (scan.status === "done" && scan.report_id) {
          // Finished earlier: the stream may be gone (server restart), so fill the grid from the report.
          const report = await api.report(scan.report_id);
          if (cancelled) return;
          setCells(Object.fromEntries(report.questions.flatMap((q) =>
            Object.entries(q.cells).map(([engine, cell]) => [cellKey(q.id, engine), { ...cell, prompt_id: q.id, engine }]))));
          setReportId(scan.report_id);
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scanId]);

  const status = useJobStream<ScanEvents>(`/api/scans/${scanId}/events`, {
    answer: (a) => setCells((prev) => ({ ...prev, [cellKey(a.prompt_id, a.engine)]: a })),
    counters: setCounters,
    done: ({ report_id }) => setReportId(report_id),
    error: ({ message }) => setError(message),
  });

  // The server lost the job (restart): the scan row still says when it finished.
  useEffect(() => {
    if (status !== "lost" || reportId) return;
    const timer = setInterval(async () => {
      try {
        const scan = await api.scan(scanId);
        if (scan.status === "done" && scan.report_id) setReportId(scan.report_id);
        if (scan.status === "failed") setError("This scan failed. Go back and run it again.");
      } catch {
        // keep polling
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [status, reportId, scanId]);

  useEffect(() => {
    if (!reportId) return;
    const timer = setTimeout(() => router.push(`/report/${reportId}`), 2200);
    return () => clearTimeout(timer);
  }, [reportId, router]);

  const total = counters?.total || (prompts ? prompts.length * Math.max(scanned.length, 1) : 0);
  const answered = counters?.answers ?? 0;

  return (
    <Screen className="max-w-[1200px]">
      <Eyebrow>Live scan</Eyebrow>
      <PageTitle>{brand ? `What AI tells people about ${brand}` : "Asking AI your questions"}</PageTitle>
      <Lead>
        Each cell is one question on one engine, checked against your FDA label as answers arrive. Claude is asked three
        times per question and a cell shows what most answers said. A live scan takes about 3 minutes.
      </Lead>

      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Answers read" value={answered} of={total} progress={total ? answered / total : 0} />
        <Stat label="Name you" value={counters?.mentions ?? 0} tone="royal" />
        <Stat label="Name a competitor" value={counters?.competitor_mentions ?? 0} />
        <Stat label="Label conflicts found" value={counters?.accuracy_issues ?? 0} tone="alert" />
      </div>

      {reportId && (
        <Panel className="mt-4 flex flex-col items-start gap-4 border-lime bg-pass-soft sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 text-[16px] font-medium">
            <span className="grid size-9 place-items-center rounded-full bg-lime text-forest">
              <Check className="size-5" strokeWidth={3} />
            </span>
            Scan complete. Opening your report…
          </p>
          <PillButton href={`/report/${reportId}`}>See your report</PillButton>
        </Panel>
      )}

      {error && <ErrorNote className="mt-4">{error}</ErrorNote>}

      <AnswerLegend className="mt-8 mb-3" multiSample />

      {prompts === null ? (
        <Skeleton className="h-[480px] rounded-2xl" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-oat/70 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="text-[13px] text-stone">
                <th scope="col" className="sticky left-0 z-10 w-[200px] min-w-[200px] bg-white px-4 py-3 font-medium md:w-[44%]">
                  Question
                </th>
                {engines.map((engine) => {
                  const live = scanned.includes(engine.name);
                  return (
                    <th key={engine.name} scope="col" className={cn("px-3 py-3 font-medium", !live && "text-taupe")}>
                      {engine.label}
                      {live && engine.samples > 1 && <span className="block text-[11px] font-normal text-taupe">asked {engine.samples}×</span>}
                      {!live && <span className="block text-[11px] font-normal">{engine.coming_soon ? "Coming soon" : "Off"}</span>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {prompts.map((prompt) => (
                <tr key={prompt.id} className="border-t border-oat/50">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 text-[14px] leading-[1.4] font-normal">
                    {prompt.text}
                    <span className="mt-1 block text-[12px] text-taupe">{AUDIENCE_SINGULAR[prompt.audience]}</span>
                  </th>
                  {engines.map((engine) => (
                    <td key={engine.name} className="px-3 py-3 align-middle">
                      <AnswerCell
                        cell={cells[cellKey(prompt.id, engine.name)]}
                        pending={scanned.includes(engine.name) && !reportId}
                        comingSoon={!scanned.includes(engine.name) && engine.coming_soon}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Screen>
  );
}

function Stat({
  label,
  value,
  of,
  progress,
  tone,
}: {
  label: string;
  value: number;
  of?: number;
  progress?: number;
  tone?: "royal" | "alert";
}) {
  return (
    <div className="rounded-2xl border border-oat/70 bg-white p-4">
      <p className="text-[13px] text-stone">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-[32px] leading-none font-medium tabular-nums",
          tone === "royal" && "text-royal-dark",
          tone === "alert" && value > 0 && "text-alert-ink"
        )}
      >
        {value}
        {of !== undefined && <span className="text-[18px] text-taupe"> / {of}</span>}
      </p>
      {progress !== undefined && (
        <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-sand">
          <span className="block h-full rounded-full bg-royal transition-[width] duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
        </span>
      )}
    </div>
  );
}
