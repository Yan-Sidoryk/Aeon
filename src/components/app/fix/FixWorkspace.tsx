"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { useJobStream } from "@/hooks/useJobStream";
import { api, errorMessage } from "@/lib/api";
import { FIX_KIND_LABEL } from "@/lib/format";
import type { Draft, Fix, FixEvents } from "@/types/api";
import { Markdown } from "../Markdown";
import { StepChecklist, type ChecklistRow } from "../StepChecklist";
import { Badge, ErrorNote, Eyebrow, Lead, PageTitle, Panel, Screen } from "../ui";
import { ClaimsTable } from "./ClaimsTable";
import { PremlrPanel } from "./PremlrPanel";

// Steps the fix job emits (backend/app/services/fix.py).
const FIX_STEPS = [
  { key: "draft", label: "Drafting from the FDA label" },
  { key: "review", label: "Running pre-MLR checks" },
] as const;

/** "Fix this": a label-grounded draft plus its pre-MLR review. Drafting runs as a background job (~1 min live). */
export function FixWorkspace({ reportId, fix, brand }: { reportId: string; fix: Fix; brand: string }) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  // 200 {draft_id} when the draft exists; 202 {job_id} while drafting. A second click joins the running job.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.startFix(reportId, fix.key);
        if (cancelled) return;
        if (res.draft_id !== null) setDraft(await api.draft(res.draft_id));
        else setJobId(res.job_id);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId, fix.key, attempt]);

  const status = useJobStream<FixEvents>(jobId ? `/api/fixes/${jobId}/events` : null, {
    step: ({ key }) => setSeen((prev) => (prev.includes(key) ? prev : [...prev, key])),
    done: ({ draft_id }) => api.draft(draft_id).then(setDraft, (err) => setError(errorMessage(err))),
    error: ({ message }) => setError(message),
  });

  // The server lost the job (restart): asking again restarts drafting, or returns the draft once it exists.
  useEffect(() => {
    if (status !== "lost" || draft) return;
    const timer = setInterval(async () => {
      try {
        const res = await api.startFix(reportId, fix.key);
        if (res.draft_id !== null) setDraft(await api.draft(res.draft_id));
      } catch {
        // keep polling
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [status, draft, reportId, fix.key]);

  const back = (
    <Link
      href={`/report/${reportId}`}
      className="inline-flex items-center gap-1.5 text-[14px] font-medium text-stone transition-colors hover:text-black"
    >
      <ArrowLeft className="size-4" /> Back to report
    </Link>
  );

  if (!draft) {
    const rows: ChecklistRow[] = FIX_STEPS.map(({ key, label }) => {
      const i = seen.indexOf(key);
      return { key, label: i === -1 ? label : `${label}…`, status: i === -1 ? "pending" : i === seen.length - 1 ? "active" : "done" };
    });
    return (
      <Screen className="max-w-[760px]">
        {back}
        <Eyebrow className="mt-8">Fix this</Eyebrow>
        <PageTitle className="text-[30px] md:text-[40px]">{fix.title}</PageTitle>
        <Lead>{fix.why}</Lead>
        {error ? (
          <ErrorNote
            className="mt-8"
            action={
              <PillButton
                variant="secondary"
                className="h-10 px-5 text-[14px]"
                onClick={() => {
                  setError(null);
                  setSeen([]);
                  setJobId(null);
                  setAttempt((n) => n + 1);
                }}
              >
                Try again
              </PillButton>
            }
          >
            {error}
          </ErrorNote>
        ) : (
          <Panel className="mt-8">
            <p className="mb-4 text-[14px] font-medium text-stone">
              About a minute. The draft uses {brand}&apos;s FDA label as its only source.
            </p>
            <StepChecklist rows={rows} />
          </Panel>
        )}
      </Screen>
    );
  }

  return (
    <Screen className="max-w-[1200px]">
      {back}
      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <article className="rounded-3xl border border-oat/70 bg-white p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="lavender">{FIX_KIND_LABEL[fix.kind]}</Badge>
              <Badge tone="white">Draft for {brand}</Badge>
            </div>
            <h1 className="mt-5 font-display text-[28px] leading-[1.15] font-medium tracking-[-0.02em] text-balance md:text-[36px]">
              {draft.title}
            </h1>
            <Markdown className="mt-6">{draft.content_md}</Markdown>
          </article>
          <ClaimsTable claims={draft.claims} />
        </div>
        <PremlrPanel draft={draft} />
      </div>
    </Screen>
  );
}
