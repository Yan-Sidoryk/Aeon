"use client";

import { ArrowRight, ExternalLink, FileCheck2, Megaphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { useJobStream } from "@/hooks/useJobStream";
import { api, errorMessage } from "@/lib/api";
import { bareDomain, formatDate, plural } from "@/lib/format";
import type { DraftSummary, FixEvents, Opportunities, Opportunity, PromoEvents, Round, StepEvent } from "@/types/api";
import { RoundsTimeline } from "../fix/RoundsTimeline";
import { StepChecklist, type ChecklistRow } from "../StepChecklist";
import { Badge, ErrorNote, Panel, Skeleton } from "../ui";
import { DraftStatusBadge } from "./checks";
import { useDashboard } from "./context";
import { PageHeading } from "./parts";
import { useApi } from "./useApi";

const MAX_STEPS = 8;

/** The promo agent's job id for a product (backend/app/routers/dashboard.py, promo_job_id). */

/** "Reading https://www.dupixent.com/long/path" → "Reading dupixent.com". */
function stepLabel(label: string): string {
  return label.replace(/^Reading (https?:\/\/\S+)/, (_, url: string) => `Reading ${bareDomain(url)}`);
}

function upsert(steps: StepEvent[], step: StepEvent): StepEvent[] {
  return steps.some((s) => s.key === step.key) ? steps.map((s) => (s.key === step.key ? step : s)) : [...steps, step];
}

/**
 * Opportunities: what competitors advertise right now (their current Google search ads) and an on-label answer to
 * each theme, quoted from the FDA label, with "Draft this".
 */
export function OpportunitiesView() {
  const { productId, product, report } = useDashboard();
  const brand = product?.brand ?? report?.product.brand ?? "your drug";
  const opps = useApi(`opportunities:${productId}`, () => api.opportunities(productId));
  const drafts = useApi(`drafts:${productId}`, () => api.drafts(productId));

  const [jobId, setJobId] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [starting, setStarting] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  const status = opps.data?.status ?? null;
  const running = status === "queued" || status === "running";
  // Follow the run we just started, or one that was already running when the page opened.
  const followId = jobId ?? (running && !finished ? (opps.data?.job_id ?? null) : null);
  const reload = opps.reload;

  const stream = useJobStream<PromoEvents>(followId ? `/api/promo/${followId}/events` : null, {
    step: (step) => setSteps((prev) => upsert(prev, step)),
    done: () => {
      setFinished(true);
      setJobId(null);
      reload();
      drafts.reload();
    },
    error: ({ message }) => {
      setFinished(true);
      setJobId(null);
      setRunError(message);
      reload();
    },
  });

  // The server doesn't know the job any more (restart): poll until the run settles, then show what it found.
  useEffect(() => {
    if (stream !== "lost") return;
    const timer = setInterval(async () => {
      try {
        const latest = await api.opportunities(productId);
        if (latest.status === "queued" || latest.status === "running") return;
        setFinished(true);
        setJobId(null);
        reload();
      } catch {
        // keep polling
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [stream, productId, reload]);

  async function research() {
    setStarting(true);
    setRunError(null);
    setSteps([]);
    setFinished(false);
    try {
      const { job_id } = await api.startOpportunities(productId);
      setJobId(job_id);
    } catch (err) {
      setRunError(errorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  const inProgress = followId !== null || starting;
  const list = opps.data?.opportunities ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Opportunities"
        description={`What competitors advertise right now, and how ${brand} can answer each theme on-label, with the FDA label text behind it.`}
      />

      {opps.error ? (
        <ErrorNote
          action={
            <PillButton variant="secondary" className="h-10 bg-white px-5 text-[14px]" onClick={reload}>
              Try again
            </PillButton>
          }
        >
          {opps.error}
        </ErrorNote>
      ) : opps.data === undefined ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      ) : inProgress ? (
        <ResearchProgress steps={steps} brand={brand} />
      ) : list.length === 0 ? (
        <Explainer
          brand={brand}
          competitors={report?.competitors.map((c) => c.brand) ?? []}
          status={status}
          error={runError}
          onStart={research}
          starting={starting}
        />
      ) : (
        <>
          {runError && <ErrorNote>{runError}</ErrorNote>}
          <p className="-mt-2 text-[14px] leading-[1.5] text-stone">
            {plural(list.length, "theme")} from {plural(opps.data.ads.length, "current ad")}.{" "}
            <span className="text-graphite">Draft this</span> writes from the FDA label only and revises until the
            pre-MLR checks pass, up to 3 rounds.
          </p>
          <ul className="flex flex-col gap-4">
            {list.map((opp, i) => (
              <li key={opp.key}>
                <OpportunityCard
                  opp={opp}
                  index={i}
                  brand={brand}
                  productId={productId}
                  draft={drafts.data?.find((d) => d.id === opp.draft_id)}
                />
              </li>
            ))}
          </ul>
          <AdsRead ads={opps.data.ads} />
          <div className="flex flex-col gap-3 border-t border-oat/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] leading-[1.5] text-stone">
              Ads change every week. Researching again replaces these {plural(list.length, "opportunity", "opportunities")}.
            </p>
            <PillButton variant="secondary" onClick={research} disabled={starting} className="h-10 px-4 text-[14px]">
              Research again
            </PillButton>
          </div>
        </>
      )}

      <SourceNote brand={brand} />
    </div>
  );
}

function SourceNote({ brand }: { brand: string }) {
  return (
    <p className="text-[12px] leading-[1.5] text-taupe">
      Competitor ads come from Google&apos;s Ads Transparency Center (current US search ads). Every angle quotes {brand}
      &apos;s FDA label word for word; a quote that isn&apos;t in the label is rejected before it reaches this page.
    </p>
  );
}

// ---- Empty state and live progress -----------------------------------------------------------------------------------

function Explainer({
  brand,
  competitors,
  status,
  error,
  onStart,
  starting,
}: {
  brand: string;
  competitors: string[];
  status: Opportunities["status"];
  error: string | null;
  onStart: () => void;
  starting: boolean;
}) {
  const failed = status === "failed" || error !== null;
  const empty = status === "done" && !error;
  return (
    <Panel className="overflow-hidden p-0 md:p-0">
      <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex flex-col items-start gap-5 p-6 md:p-10">
          <span className="grid size-11 place-items-center rounded-xl bg-periwinkle text-navy">
            <Megaphone className="size-5" />
          </span>
          <div>
            <p className="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-balance md:text-[30px]">
              {empty ? "No current competitor ads found" : "What are competitors promoting right now?"}
            </p>
            <p className="mt-3 max-w-[520px] text-[16px] leading-[1.55] text-stone">
              {empty
                ? "The last run found no current US search ads for your competitors. Ads change often, so try again in a week."
                : `Aeon reads each competitor's current US search ads, groups them into themes, and proposes how ${brand} can answer each one on-label, quoting the FDA label. It takes about 2 minutes.`}
            </p>
          </div>
          {failed && (
            <p role="alert" className="rounded-xl border border-alert-line bg-alert-soft px-4 py-3 text-[14px] leading-[1.45] text-alert-ink">
              {error ?? "The last research run didn't finish."} Try again.
            </p>
          )}
          <PillButton onClick={onStart} disabled={starting}>
            {starting ? "Starting…" : failed || empty ? "Research again" : "Research competitors' promotion"}
          </PillButton>
        </div>
        <div className="flex flex-col justify-center gap-3 border-t border-oat/70 bg-offwhite p-6 md:border-t-0 md:border-l md:p-10">
          <p className="text-[13px] font-medium text-stone">You get, for each theme</p>
          <ol className="flex flex-col gap-2.5 text-[15px] leading-[1.45]">
            {[
              "The claims competitors lead with, quoted from their ads",
              `An angle ${brand}'s label supports, with the label text behind it`,
              "A format to use it in, and a draft that has passed pre-MLR checks",
            ].map((line, i) => (
              <li key={line} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white text-[12px] font-medium shadow-[0_0_0_1px_var(--color-oat)]">
                  {i + 1}
                </span>
                {line}
              </li>
            ))}
          </ol>
          {competitors.length > 0 && (
            <div className="mt-2">
              <p className="text-[13px] font-medium text-stone">Your tracked competitors</p>
              <p className="mt-2 flex flex-wrap gap-1.5">
                {competitors.map((c) => (
                  <Badge key={c} tone="white">
                    {c}
                  </Badge>
                ))}
              </p>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

function ResearchProgress({ steps, brand }: { steps: StepEvent[]; brand: string }) {
  const start = steps.find((s) => s.key === "start");
  const rest = steps.filter((s) => s.key !== "start");
  const rows: ChecklistRow[] = [
    start
      ? { key: start.key, label: start.label, status: start.status === "done" ? "done" : "active" }
      : { key: "start", label: "Starting the research…", status: "active" },
    ...rest.slice(-MAX_STEPS).map(
      (s): ChecklistRow => ({ key: s.key, label: stepLabel(s.label), status: s.status === "active" ? "active" : "done" })
    ),
  ];
  const found = rest.filter((s) => s.label.startsWith("Opportunity:")).length;

  return (
    <Panel className="p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-[22px] leading-[1.2] font-medium tracking-[-0.01em]">Researching competitors&apos; promotion</p>
        <p className="text-[14px] text-stone">{found > 0 ? `${plural(found, "opportunity", "opportunities")} so far` : "About 2 minutes"}</p>
      </div>
      <p className="mt-1.5 text-[14px] text-stone">
        Reading their current ads and checking every angle against {brand}&apos;s label. You can leave this page; the
        results stay here.
      </p>
      <StepChecklist rows={rows} className="mt-5 [&_li]:h-auto [&_li]:min-h-12 [&_li]:py-3 [&_li]:leading-[1.35] [&_li]:wrap-anywhere" />
    </Panel>
  );
}

// ---- Opportunity cards -------------------------------------------------------------------------------------------------

function OpportunityCard({
  opp,
  index,
  brand,
  productId,
  draft,
}: {
  opp: Opportunity;
  index: number;
  brand: string;
  productId: number;
  draft: DraftSummary | undefined;
}) {
  return (
    <article className="rounded-2xl border border-oat/70 bg-white p-5 md:p-7">
      <div className="flex min-w-0 items-start gap-3">
        <span className="font-display text-[26px] leading-none font-medium text-oat tabular-nums">{index + 1}</span>
        <h3 className="min-w-0 font-display text-[22px] leading-[1.2] font-medium tracking-[-0.015em] text-balance">{opp.theme}</h3>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <section aria-label="What competitors say" className="rounded-xl bg-offwhite p-4 md:p-5">
          <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-stone">
            What they say
            {opp.competitors.map((c) => (
              <Badge key={c} className="h-5 bg-stone/12 px-2 text-[11px]">
                {c}
              </Badge>
            ))}
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {opp.their_claims.map((claim, i) => (
              <li key={i}>
                <blockquote className="border-l-2 border-stone/30 pl-3 text-[15px] leading-[1.45] text-graphite">“{claim}”</blockquote>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label={`How ${brand} can answer`} className="rounded-xl border border-periwinkle-dark/40 bg-periwinkle/30 p-4 md:p-5">
          <p className="text-[13px] font-medium text-navy">Your on-label answer</p>
          <p className="mt-2 text-[15px] leading-[1.5] text-black">{opp.our_angle}</p>
          <figure className="mt-4 rounded-lg bg-white/80 p-3">
            <figcaption>
              <Badge tone="periwinkle" className="h-5 gap-1 px-2 text-[11px]">
                <FileCheck2 className="size-3" strokeWidth={2.5} />
                FDA label
              </Badge>
            </figcaption>
            <blockquote className="mt-2 text-[14px] leading-[1.5] text-navy">“{opp.label_support}”</blockquote>
          </figure>
        </section>
      </div>

      <DraftAction opp={opp} productId={productId} draft={draft} />
    </article>
  );
}

function DraftAction({ opp, productId, draft }: { opp: Opportunity; productId: number; draft: DraftSummary | undefined }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftHref = (id: number) => `/app/${productId}/content/${id}`;

  const status = useJobStream<FixEvents>(jobId ? `/api/fixes/${jobId}/events` : null, {
    round: (round) => setRounds((prev) => [...prev.filter((r) => r.round !== round.round), round]),
    done: ({ draft_id }) => router.push(draftHref(draft_id)),
    error: ({ message }) => {
      setError(message);
      setJobId(null);
      setBusy(false);
    },
  });

  // The server lost the job (restart): the opportunity gets its draft_id once the draft is saved.
  useEffect(() => {
    if (status !== "lost") return;
    const timer = setInterval(async () => {
      try {
        const latest = await api.opportunities(productId);
        const id = latest.opportunities.find((o) => o.key === opp.key)?.draft_id;
        if (id) router.push(`/app/${productId}/content/${id}`);
      } catch {
        // keep polling
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [status, productId, opp.key, router]);

  async function start() {
    setBusy(true);
    setError(null);
    setRounds([]);
    try {
      const res = await api.draftOpportunity(productId, opp.key);
      if (res.draft_id !== null) router.push(draftHref(res.draft_id));
      else setJobId(res.job_id);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  const existing = opp.draft_id ?? draft?.id ?? null;

  return (
    <div className="mt-5 border-t border-oat/70 pt-5">
      {jobId ? (
        <div>
          <p className="text-[14px] font-medium">Drafting from the FDA label, then checking it</p>
          <p className="mt-1 text-[13px] text-stone">
            About a minute. Each round runs the pre-MLR checklist and revises what failed.
          </p>
          <RoundsTimeline rounds={rounds} live className="mt-4" />
        </div>
      ) : existing !== null ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="flex flex-wrap items-center gap-2 text-[13px] text-stone">
              <DraftStatusBadge status={draft?.status} />
              {draft ? plural(draft.rounds, "review round") : "Drafted"}
            </p>
            <FormatNote format={opp.format} />
          </div>
          <PillButton href={draftHref(existing)} variant="secondary" className="h-11 shrink-0 gap-2 px-5 text-[15px]">
            Open draft
            <ArrowRight className="size-4" />
          </PillButton>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FormatNote format={opp.format} />
          <PillButton onClick={start} disabled={busy} className="h-11 shrink-0 px-5 text-[15px]">
            {busy ? "Starting…" : "Draft this"}
          </PillButton>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-[14px] text-alert-ink">{error}</p>}
    </div>
  );
}

function FormatNote({ format }: { format: string }) {
  if (!format) return null;
  return (
    <p className="min-w-0 text-[13px] leading-[1.45] text-stone">
      <span className="font-medium text-graphite">Use it in:</span> {format}
    </p>
  );
}

// ---- Evidence: the ads Aeon read -------------------------------------------------------------------------------------

function shownDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : formatDate(value);
}

function AdsRead({ ads }: { ads: Opportunities["ads"] }) {
  if (ads.length === 0) return null;
  return (
    <details className="group rounded-2xl border border-oat/70 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium md:px-6">
        <span>
          Ads we read · {ads.length}{" "}
          <span className="font-normal text-stone">from {plural(new Set(ads.map((a) => a.competitor)).size, "competitor")}</span>
        </span>
        <ArrowRight className="size-4 shrink-0 text-taupe transition-transform group-open:rotate-90" />
      </summary>
      <ul className="border-t border-oat/60">
        {ads.map((ad) => (
          <li
            key={ad.ad_id}
            className="flex flex-col gap-1 border-t border-oat/50 px-5 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-6"
          >
            <span className="min-w-0 text-[14px]">
              <span className="font-medium">{ad.competitor}</span>
              <span className="text-stone"> · {ad.advertiser}</span>
              {ad.first_shown && <span className="text-taupe"> · first shown {shownDate(ad.first_shown)}</span>}
            </span>
            {ad.url && (
              <a
                href={ad.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-[13px] font-medium text-royal-dark underline-offset-4 hover:underline"
              >
                View ad <ExternalLink className="size-3.5" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
