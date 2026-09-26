"use client";

import { ArrowRight, FileText, Megaphone } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { FIX_KIND_LABEL, plural } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DraftSummary, PremlrStatus } from "@/types/api";
import { Badge, ErrorNote, Panel, Skeleton } from "../ui";
import { DraftStatusBadge } from "./checks";
import { useDashboard } from "./context";
import { PageHeading, PanelTitle } from "./parts";
import { useApi } from "./useApi";

const STATUSES: { status: PremlrStatus; label: string; tone: string }[] = [
  { status: "ready", label: "Ready for MLR review", tone: "text-forest" },
  { status: "needs_changes", label: "Need changes", tone: "text-[#a84300]" },
  { status: "blocked", label: "Blocked", tone: "text-alert-ink" },
];

/** Opportunity drafts are stored under "opp-<key>" (backend/app/routers/dashboard.py). */
const fromOpportunity = (d: DraftSummary) => d.fix_key.startsWith("opp-");

/** Content: every draft for this drug with its pre-MLR status, plus the report fixes not drafted yet. */
export function ContentView() {
  const { productId, base, report } = useDashboard();
  const drafts = useApi(`drafts:${productId}`, () => api.drafts(productId));
  const list = drafts.data ?? [];
  const drafted = new Set(list.map((d) => d.fix_key));
  const suggested = (report?.fixes ?? []).filter((f) => !drafted.has(f.key));

  return (
    <div className="flex flex-col gap-6">
      <PageHeading
        title="Content"
        description="Drafts written from the FDA label only. Each one ran the pre-MLR checklist, round by round, before you see it."
      />

      {drafts.error ? (
        <ErrorNote>{drafts.error}</ErrorNote>
      ) : drafts.data === undefined ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : list.length === 0 ? (
        <Panel className="flex flex-col items-start gap-3 p-6 md:p-8">
          <span className="grid size-11 place-items-center rounded-xl bg-lavender text-eggplant">
            <FileText className="size-5" />
          </span>
          <p className="font-display text-[24px] leading-[1.15] font-medium tracking-[-0.02em]">No drafts yet</p>
          <p className="max-w-[560px] text-[15px] leading-[1.55] text-stone">
            Start one from a fix in the latest report or from a competitor opportunity. Aeon drafts from the label and
            revises until the pre-MLR checks pass.
          </p>
        </Panel>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-3">
            {STATUSES.map(({ status, label, tone }) => {
              const n = list.filter((d) => d.status === status).length;
              return (
                <div key={status} className="rounded-2xl border border-oat/70 bg-white p-4">
                  <dt className="text-[13px] leading-[1.3] text-stone">{label}</dt>
                  <dd className={cn("mt-2 font-display text-[30px] leading-none font-medium tabular-nums", n > 0 ? tone : "text-taupe")}>
                    {n}
                  </dd>
                </div>
              );
            })}
          </dl>

          <ul className="flex flex-col gap-2.5">
            {list.map((d) => (
              <li key={d.id}>
                <Link
                  href={`${base}/content/${d.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-oat/70 bg-white p-4 transition-shadow hover:shadow-[0_0_0_1px_var(--color-stone)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal md:p-5"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "hidden size-10 shrink-0 place-items-center rounded-xl sm:grid",
                      fromOpportunity(d) ? "bg-periwinkle text-navy" : "bg-lavender text-eggplant"
                    )}
                  >
                    {fromOpportunity(d) ? <Megaphone className="size-[18px]" /> : <FileText className="size-[18px]" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <DraftStatusBadge status={d.status} />
                      <span className="text-[12px] text-stone">
                        {plural(d.rounds, "review round")} · {fromOpportunity(d) ? "From an opportunity" : "From a report fix"}
                      </span>
                    </span>
                    <span className="mt-2 line-clamp-2 block text-[16px] leading-[1.35] font-medium group-hover:underline">
                      {d.title}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-taupe transition-transform group-hover:translate-x-0.5 group-hover:text-black" />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {(suggested.length > 0 || report) && (
        <section aria-labelledby="suggested-title" className="mt-4">
          <PanelTitle>
            <span id="suggested-title">Draft next</span>
          </PanelTitle>
          <p className="mt-1 text-[14px] text-stone">Fixes from the latest report that don&apos;t have a draft yet.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {suggested.map((fix) => (
              <article key={fix.key} className="flex flex-col rounded-2xl border border-oat/70 bg-white p-5">
                <Badge tone="lavender" className="w-fit">
                  {FIX_KIND_LABEL[fix.kind] ?? fix.kind}
                </Badge>
                <h3 className="mt-3 font-display text-[17px] leading-[1.3] font-medium">{fix.title}</h3>
                <p className="mt-2 line-clamp-3 text-[14px] leading-[1.5] text-graphite">{fix.why}</p>
                {report && (
                  <Link
                    href={`/report/${report.id}/fix/${encodeURIComponent(fix.key)}`}
                    className="mt-auto inline-flex items-center gap-1 pt-4 text-[14px] font-medium text-royal-dark underline-offset-4 hover:underline"
                  >
                    Fix this <ArrowRight className="size-3.5" />
                  </Link>
                )}
              </article>
            ))}
            <Link
              href={`${base}/opportunities`}
              className="group flex flex-col justify-between gap-4 rounded-2xl border-2 border-dashed border-oat p-5 transition-colors hover:border-royal/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
            >
              <span>
                <span className="block font-display text-[17px] leading-[1.3] font-medium">Answer a competitor&apos;s ad</span>
                <span className="mt-2 block text-[14px] leading-[1.5] text-stone">
                  See what competitors advertise right now and draft an on-label answer to a theme.
                </span>
              </span>
              <span className="inline-flex items-center gap-1 text-[14px] font-medium text-royal-dark">
                Opportunities <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
