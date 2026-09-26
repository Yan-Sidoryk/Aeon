"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { formatDate, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tracking } from "@/types/api";
import { ErrorNote, Panel, Skeleton } from "../ui";
import { useDashboard } from "./context";
import { PageHeading, PanelTitle } from "./parts";
import { ScanHistory, type HistoryEntry } from "./ScanHistory";
import { useApi } from "./useApi";

/** Tracking: the weekly re-scan switch, the next run, and every scan of this drug. */
export function TrackingView() {
  const { productId, product, report, history } = useDashboard();
  const tracking = useApi(`tracking:${productId}`, () => api.tracking(productId));
  const scans = useApi(`scans:${productId}`, () => api.scans(productId));
  const [saved, setSaved] = useState<{ productId: number; value: Tracking } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = saved?.productId === productId ? saved.value : tracking.data;
  const brand = product?.brand ?? "this drug";

  async function toggle() {
    if (!current || saving) return;
    const weekly = !current.weekly;
    setSaving(true);
    setError(null);
    setSaved({ productId, value: { ...current, weekly } });
    try {
      setSaved({ productId, value: await api.setTracking(productId, weekly) });
    } catch (err) {
      setSaved({ productId, value: current });
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  // Every scan, newest first, with the counts from its report once it finished.
  const done = scans.data?.filter((s) => s.status === "done") ?? [];
  const oldestDone = done.at(-1)?.id;
  const entries: HistoryEntry[] = (scans.data ?? []).map((scan) => {
    const row = history?.find((h) => h.scan_id === scan.id);
    return {
      key: String(scan.id),
      date: row?.finished_at ?? scan.finished_at ?? scan.started_at,
      kind: scan.kind,
      status: scan.status,
      scanId: scan.id,
      reportId: row?.report_id ?? scan.report_id,
      summary: row?.summary,
      changes: scan.id === oldestDone ? undefined : row?.changes,
    };
  });

  const questions = report?.questions.length;
  const engines = report?.engines.map((e) => e.label);

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Tracking"
        description="A weekly scan asks the same questions on the same engines, so a change in the answers is a change in AI, not in the test."
      />

      <Panel className="p-5 md:p-7">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <PanelTitle>
              <span id="weekly-label">Weekly re-scan</span>
            </PanelTitle>
            <p className="mt-1.5 max-w-[560px] text-[15px] leading-[1.5] text-stone">
              {questions && engines
                ? `Every week: the same ${questions} questions about ${brand} on ${engines.join(", ")}, each answer checked against the FDA label.`
                : `Every week: the same questions about ${brand} on every live engine, each answer checked against the FDA label.`}
            </p>
          </div>
          {current === undefined ? (
            <Skeleton className="h-7 w-12 rounded-full" />
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={current.weekly}
              aria-labelledby="weekly-label"
              onClick={toggle}
              disabled={saving}
              className={cn(
                "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal disabled:cursor-wait",
                current.weekly ? "bg-royal" : "bg-oat"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
                  current.weekly ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-offwhite p-4">
            <p className="text-[13px] text-stone">Next scan</p>
            {current === undefined ? (
              <Skeleton className="mt-2 h-7 w-36" />
            ) : (
              <p className="mt-1.5 font-display text-[22px] leading-tight font-medium tracking-[-0.01em]">
                {current.weekly && current.next_run_at ? formatDate(current.next_run_at) : "Not scheduled"}
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-offwhite p-4">
            <p className="text-[13px] text-stone">Scans so far</p>
            <p className="mt-1.5 font-display text-[22px] leading-tight font-medium tracking-[-0.01em]">
              {history ? plural(history.length, "finished scan") : "…"}
            </p>
          </div>
        </div>
        {current && !current.weekly && (
          <p className="mt-4 text-[14px] leading-[1.5] text-stone">
            Off: nothing runs until you run a scan yourself. Turn it on and the first weekly scan runs a week from now.
          </p>
        )}
        {(error || tracking.error) && <ErrorNote className="mt-4">{error ?? tracking.error}</ErrorNote>}
      </Panel>

      <section aria-labelledby="scans-title">
        <PanelTitle>
          <span id="scans-title">Scan history</span>
        </PanelTitle>
        <p className="mt-1 text-[14px] text-stone">Unbranded questions that name {brand}, per engine, for every scan.</p>
        {scans.error ? (
          <ErrorNote className="mt-4">{scans.error}</ErrorNote>
        ) : scans.data === undefined ? (
          <Skeleton className="mt-4 h-40 rounded-2xl" />
        ) : entries.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-oat/70 bg-white p-5 text-[15px] text-graphite">No scans yet.</p>
        ) : (
          <ScanHistory entries={entries} brand={brand} className="mt-4" />
        )}
      </section>
    </div>
  );
}
