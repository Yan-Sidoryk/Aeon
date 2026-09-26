"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { useJobStream } from "@/hooks/useJobStream";
import { api, errorMessage } from "@/lib/api";
import type { DiscoveryEvents, OnboardingStart, StepEvent } from "@/types/api";
import { StepChecklist, type ChecklistRow } from "./StepChecklist";
import { ErrorNote, Eyebrow, Lead, PageTitle, Panel, Screen, inputClass } from "./ui";

// The discovery agent (backend/app/agents/discovery.py) streams one step per page it reads and label it checks.
const MAX_ROWS = 9;

/** Screen 1, "How does AI talk about your drugs?": one input, then a live checklist while discovery runs. */
export function StartScreen({ initialUrl }: { initialUrl: string }) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [job, setJob] = useState<OnboardingStart | null>(null);
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const portfolioHref = (companyId: number) => `/start/portfolio?company=${companyId}`;

  const status = useJobStream<DiscoveryEvents>(job ? `/api/onboarding/${job.job_id}/events` : null, {
    step: (step) =>
      setSteps((prev) => (prev.some((p) => p.key === step.key) ? prev.map((p) => (p.key === step.key ? step : p)) : [...prev, step])),
    done: ({ company_id }) => router.push(portfolioHref(company_id)),
    error: ({ message }) => setError(message),
  });

  // The server lost the job (restart): the company row still tells us when discovery finished.
  useEffect(() => {
    if (status !== "lost" || !job) return;
    const timer = setInterval(async () => {
      try {
        const company = await api.company(job.company_id);
        if (company.status === "ready") router.push(portfolioHref(company.id));
        if (company.status === "failed") setError("We couldn't read that website. Check the address and try again.");
      } catch {
        // keep polling
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [status, job, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = url.trim();
    if (!value) return;
    setError(null);
    setSteps([]);
    setSubmitting(true);
    try {
      setJob(await api.startOnboarding(value));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const running = job !== null && error === null;
  // Newest steps last; while the agent works, the latest row spins.
  const visible = steps.slice(-MAX_ROWS);
  const rows: ChecklistRow[] = visible.length
    ? visible.map((step, i) => ({
        key: step.key,
        label: step.label,
        status: step.status === "active" || (running && status !== "done" && i === visible.length - 1 && step.status !== "done")
          ? "active"
          : "done",
      }))
    : [{ key: "start", label: "Starting the discovery agent…", status: "active" }];
  const hidden = steps.length - visible.length;

  return (
    <Screen className="max-w-[760px] text-center">
      <Eyebrow>Free first report</Eyebrow>
      <PageTitle>How does AI talk about your drugs?</PageTitle>
      <Lead className="mx-auto">
        Type your company website. Our agents find your products and their FDA labels, then ask AI the questions
        patients, caregivers and doctors really ask. No account needed.
      </Lead>

      <form onSubmit={submit} className="mx-auto mt-10 flex max-w-[600px] flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Your company website</span>
          <Globe aria-hidden="true" className="pointer-events-none absolute top-1/2 left-5 size-5 -translate-y-1/2 text-taupe" />
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            autoFocus
            spellCheck={false}
            placeholder="acmepharma.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={running || submitting}
            className={`${inputClass} h-14 pl-13 text-[17px]`}
          />
        </label>
        <PillButton type="submit" disabled={running || submitting || !url.trim()} className="h-14 px-7">
          {submitting ? "Starting…" : "Scan my brands"}
        </PillButton>
      </form>
      <p className="mt-4 text-[13px] text-stone">US prescription and OTC brands. We read your public pages and openFDA.</p>

      {job !== null && (
        <Panel className="mx-auto mt-10 max-w-[600px] text-left">
          <p className="mb-4 text-[14px] font-medium text-stone">
            {error
              ? "Stopped"
              : status === "lost"
                ? "Still working… (reconnecting)"
                : "Claude is reading your site and checking every product against its FDA label. Usually under a minute."}
          </p>
          {hidden > 0 && <p className="mb-2 text-[13px] text-taupe">+{hidden} earlier steps</p>}
          <StepChecklist rows={rows} />
        </Panel>
      )}

      {error && (
        <ErrorNote
          className="mx-auto mt-6 max-w-[600px] text-left"
          action={
            <PillButton variant="secondary" className="h-10 shrink-0 px-5 text-[14px]" onClick={() => setJob(null)}>
              Try again
            </PillButton>
          }
        >
          {error}
        </ErrorNote>
      )}
    </Screen>
  );
}
