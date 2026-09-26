"use client";

import { ArrowRight, ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { PillButton, START_HREF } from "@/components/ui/pill-button";
import { formatDate, plural } from "@/lib/format";
import type { Company } from "@/types/api";
import { CheckStrip, tallyChecks } from "./checks";
import { EngineMark, shortEngineLabel } from "./engines";
import { loadPortfolio, type Drug } from "./portfolio";
import { useApi } from "./useApi";
import { ErrorNote, Eyebrow, Lead, PageTitle, Screen, Skeleton } from "../ui";

/** /app: the drugs that have a dashboard, each with its latest checks. */
export function DrugList() {
  const portfolio = useApi("portfolio", loadPortfolio);
  const { data, error } = portfolio;

  if (error) {
    return (
      <Screen>
        <ErrorNote
          action={
            <PillButton variant="secondary" className="h-10 bg-white px-5 text-[14px]" onClick={portfolio.reload}>
              Try again
            </PillButton>
          }
        >
          {error}
        </ErrorNote>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-12 w-72 max-w-full" />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </Screen>
    );
  }

  if (data.drugs.length === 0) {
    return (
      <Screen>
        <Eyebrow>Your dashboard</Eyebrow>
        <PageTitle>No drugs set up yet</PageTitle>
        <Lead>
          Start with your company website. We find your drugs and their FDA labels, ask AI what patients and doctors
          ask, and check every answer. Your first report takes about 5 minutes.
        </Lead>
        <PillButton href={START_HREF} className="mt-8">
          Start your free report
        </PillButton>
      </Screen>
    );
  }

  const groups = data.companies
    .map((company) => ({ company, drugs: data.drugs.filter((d) => d.company.id === company.id) }))
    .filter((g) => g.drugs.length > 0);

  return (
    <Screen className="max-w-[1200px]">
      <Eyebrow>Your dashboard</Eyebrow>
      <PageTitle>Your drugs</PageTitle>
      <Lead>How AI answers questions about each drug, from its latest scan. Open one for every answer behind the counts.</Lead>

      {groups.map(({ company, drugs }) => (
        <section key={company.id} aria-label={company.name || company.domain} className="mt-10">
          <CompanyLine company={company} />
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {drugs.map((drug) => (
              <li key={drug.product.id}>
                <DrugCard drug={drug} />
              </li>
            ))}
            <li>
              <Link
                href={`/start/hero?company=${company.id}`}
                className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-oat p-6 text-center text-stone transition-colors hover:border-royal/50 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
              >
                <span className="grid size-10 place-items-center rounded-full bg-white shadow-[0_0_0_1px_var(--color-oat)]">
                  <Plus className="size-5" />
                </span>
                <span className="text-[15px] font-medium">Set up another drug</span>
                <span className="max-w-[240px] text-[13px] leading-[1.45]">
                  Pick one of your marketed products; we propose its competitors and questions.
                </span>
              </Link>
            </li>
          </ul>
        </section>
      ))}
    </Screen>
  );
}

function CompanyLine({ company }: { company: Company }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-stone">
      <span className="font-display text-[20px] font-medium text-black">{company.name || company.domain}</span>
      <a
        href={`https://${company.domain}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 underline-offset-4 hover:text-black hover:underline"
      >
        {company.domain}
        <ExternalLink className="size-3.5" />
      </a>
    </p>
  );
}

function DrugCard({ drug }: { drug: Drug }) {
  const { product, latest, scans } = drug;
  const molecule = product.molecule && product.molecule.toLowerCase() !== product.brand.toLowerCase() ? product.molecule : "";
  const engines = latest ? Object.entries(latest.summary) : [];
  const conflicts = engines.reduce((n, [, s]) => n + s.label_conflicts, 0);

  return (
    <Link
      href={`/app/${product.id}`}
      className="group flex h-full flex-col rounded-3xl border border-oat/70 bg-white p-6 transition-shadow hover:shadow-[0_0_0_1px_var(--color-stone)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-display text-[28px] leading-none font-medium tracking-[-0.02em] break-words">
            {product.brand}
          </span>
          {molecule && <span className="mt-1.5 block text-[14px] text-stone">{molecule}</span>}
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand transition-colors group-hover:bg-royal group-hover:text-white">
          <ArrowRight className="size-4" />
        </span>
      </span>
      {product.indication && <span className="mt-3 line-clamp-2 text-[14px] leading-[1.45] text-graphite">{product.indication}</span>}

      {latest ? (
        <>
          <span className="mt-5 block text-[12px] font-medium text-stone">Unbranded questions that name {product.brand}</span>
          <span className="mt-2 flex flex-col gap-2">
            {engines.map(([name, s]) => (
              <span key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <span className="flex min-w-0 items-center gap-2 text-[14px]">
                  <EngineMark engine={name} size={16} />
                  <span className="truncate">{shortEngineLabel(name, s.label)}</span>
                </span>
                <span className="flex items-center gap-2.5">
                  <CheckStrip
                    size="sm"
                    checks={tallyChecks(s.unbranded)}
                    label={`${s.label} names ${product.brand} in ${s.unbranded.you} of ${s.unbranded.asked} unbranded questions`}
                    className="flex-nowrap"
                  />
                  <span className="w-11 text-right text-[13px] whitespace-nowrap tabular-nums">
                    <span className="font-medium text-royal-dark">{s.unbranded.you}</span>
                    <span className="text-stone"> of {s.unbranded.asked}</span>
                  </span>
                </span>
              </span>
            ))}
          </span>
          <span className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-5 text-[13px] text-stone">
            <span>Last scan {formatDate(latest.finished_at)}</span>
            <span aria-hidden="true">·</span>
            <span>{plural(scans, "scan")}</span>
            {conflicts > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-alert-ink">{plural(conflicts, "label conflict")}</span>
              </>
            )}
          </span>
        </>
      ) : (
        <span className="mt-auto pt-5 text-[14px] text-stone">Set up, not scanned yet. Open it to run the first scan.</span>
      )}
    </Link>
  );
}
