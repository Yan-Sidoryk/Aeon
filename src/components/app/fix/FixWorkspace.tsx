"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PillButton, START_HREF } from "@/components/ui/pill-button";
import { useJobStream } from "@/hooks/useJobStream";
import { ApiError, api, errorMessage } from "@/lib/api";
import { FIX_KIND_LABEL } from "@/lib/format";
import type { Draft, Fix, FixEvents, FixStart, Round } from "@/types/api";
import { KIND_TONE, decodeEscapes } from "../report/report-utils";
import { Badge, ErrorNote, Eyebrow, PageTitle, Panel, Screen, Spinner } from "../ui";
import { DraftView } from "./DraftView";
import { MAX_ROUNDS } from "./draft-utils";
import { RoundsTimeline } from "./RoundsTimeline";

type Failure = { message: string; retry: boolean };

// Stop polling for a draft whose job the server lost after about three minutes.
const LOST_POLLS = 60;

function startFailure(err: unknown): Failure {
  // The report is public but drafting spends money, so only the account that ran the scan can start it.
  if (err instanceof ApiError && [401, 403, 404].includes(err.status)) {
    return {
      message:
        "No draft for this fix yet, and only the account that ran this scan can write one. Open this page in the browser that ran the scan, or start a report of your own.",
      retry: false,
    };
  }
  return { message: errorMessage(err), retry: true };
}

type Props = {
  reportId: string;
  fix: Fix;
  brand: string;
  /** The draft when it already exists (fetched with the page). */
  initialDraft: Draft | null;
};

/**
 * "Fix this": the fix agent drafts from the label, runs the pre-MLR checklist, revises what failed and checks again
 * (up to 3 rounds), streaming each round. A finished draft shows straight away.
 */
export function FixWorkspace({ reportId, fix, brand, initialDraft }: Props) {
  const [draft, setDraft] = useState<Draft | null>(initialDraft);
  const [jobId, setJobId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [step, setStep] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [attempt, setAttempt] = useState(0);

  // Public with the report link, so it works for anyone who can see the report.
  const loadDraft = useCallback(() => api.reportDraft(reportId, fix.key), [reportId, fix.key]);

  // 200 {draft_id} when the draft exists, 202 {job_id} while the fix agent works. Asking again joins the same job.
  useEffect(() => {
    if (initialDraft) return;
    let cancelled = false;
    (async () => {
      let res: FixStart;
      try {
        res = await api.startFix(reportId, fix.key);
      } catch (err) {
        if (!cancelled) setFailure(startFailure(err));
        return;
      }
      if (cancelled) return;
      if (res.draft_id === null) {
        setJobId(res.job_id);
        return;
      }
      try {
        const found = await loadDraft();
        if (!cancelled) setDraft(found);
      } catch (err) {
        if (!cancelled) setFailure({ message: errorMessage(err), retry: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialDraft, reportId, fix.key, loadDraft, attempt]);

  // The server replays the job's whole history on connect, so these must be idempotent.
  const status = useJobStream<FixEvents>(jobId ? `/api/fixes/${jobId}/events` : null, {
    step: ({ label }) => setStep(label),
    round: (round) => setRounds((prev) => [...prev.filter((r) => r.round !== round.round), round]),
    done: () => {
      setFinishing(true);
      loadDraft().then(setDraft, (err) => setFailure({ message: errorMessage(err), retry: true }));
    },
    error: ({ message }) => setFailure({ message, retry: true }),
  });

  // The server doesn't know the job (it was lost): the draft appears on the report once it's saved.
  useEffect(() => {
    if (status !== "lost" || draft) return;
    let polls = 0;
    const timer = setInterval(() => {
      polls += 1;
      loadDraft().then(setDraft, () => {
        if (polls < LOST_POLLS) return;
        clearInterval(timer);
        setFailure({ message: "We lost track of this draft. Try again.", retry: true });
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [status, draft, loadDraft]);

  function retry() {
    setFailure(null);
    setRounds([]);
    setStep(null);
    setFinishing(false);
    setJobId(null);
    setAttempt((n) => n + 1);
  }

  const title = decodeEscapes(fix.title);
  const back = (
    <Link
      href={`/report/${reportId}`}
      className="inline-flex items-center gap-1.5 text-[14px] font-medium text-stone transition-colors hover:text-black"
    >
      <ArrowLeft className="size-4" aria-hidden="true" /> Back to report
    </Link>
  );

  if (draft) {
    return (
      <Screen className="max-w-[1200px]">
        {back}
        <div className="mt-6 mb-8 max-w-[820px]">
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>Fix this</Eyebrow>
            <Badge tone={KIND_TONE[fix.kind]}>{FIX_KIND_LABEL[fix.kind]}</Badge>
          </div>
          <h1 className="mt-2 font-display text-[22px] leading-[1.25] font-medium tracking-[-0.015em] text-balance text-graphite md:text-[26px]">
            {title}
          </h1>
        </div>
        <DraftView draft={draft} brand={brand} />
      </Screen>
    );
  }

  const running = jobId !== null && !failure;
  const latest = finishing
    ? "Checks done. Opening the draft…"
    : (step ?? (jobId ? "Starting the fix agent…" : "Checking for a draft…"));

  return (
    <Screen className="max-w-[760px]">
      {back}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Eyebrow>Fix this</Eyebrow>
        <Badge tone={KIND_TONE[fix.kind]}>{FIX_KIND_LABEL[fix.kind]}</Badge>
      </div>
      <PageTitle className="text-[28px] leading-[1.12] md:text-[34px]">{title}</PageTitle>

      {failure ? (
        <ErrorNote
          className="mt-8"
          action={
            failure.retry ? (
              <PillButton variant="secondary" className="h-10 shrink-0 px-5 text-[14px]" onClick={retry}>
                Try again
              </PillButton>
            ) : (
              <PillButton href={START_HREF} variant="secondary" className="h-10 shrink-0 px-5 text-[14px]">
                Start a report
              </PillButton>
            )
          }
        >
          {failure.message}
        </ErrorNote>
      ) : (
        <Panel className="mt-8">
          <p aria-live="polite" className="flex items-center gap-2.5 text-[16px] font-medium">
            <Spinner className="shrink-0" />
            {latest}
          </p>
          <p className="mt-2 text-[14px] leading-[1.5] text-stone">
            About a minute or two. The draft uses {brand}&apos;s FDA label as its only source, and the fix agent revises it
            until every pre-MLR check passes, in up to {MAX_ROUNDS} rounds.
          </p>
          {running && <RoundsTimeline rounds={rounds} live={!finishing} className="mt-6 border-t border-oat/70 pt-5" />}
        </Panel>
      )}

      <div className="mt-10">
        <p className="text-[14px] font-medium">Why this fix</p>
        <p className="mt-2 max-w-[680px] text-[15px] leading-[1.6] text-stone">{decodeEscapes(fix.why)}</p>
      </div>
    </Screen>
  );
}
