"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { api, errorMessage } from "@/lib/api";
import { loadSetup } from "@/lib/setup-cache";
import { cn } from "@/lib/utils";
import type { Company } from "@/types/api";
import { heroCandidates } from "./PortfolioScreen";
import { ProductBadges } from "./ProductBadges";
import { ActionBar, Badge, ErrorNote, Eyebrow, Lead, PageTitle, Screen, Skeleton } from "./ui";

/** Screen 3, "Which drug should we start with?": one hero drug for a focused first scan. */
export function HeroScreen({ companyId, demo }: { companyId: number; demo: boolean }) {
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .company(companyId)
      .then((c) => {
        if (cancelled) return;
        setCompany(c);
        const candidates = heroCandidates(c);
        setPicked((candidates.find((p) => p.is_hero) ?? candidates[0])?.id ?? null);
      })
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  // Start the setup agent (~1 min live) while the user is still here, once they've settled on a drug.
  useEffect(() => {
    if (picked === null) return;
    const timer = setTimeout(() => {
      loadSetup(picked).catch((err) => setUnavailable((prev) => ({ ...prev, [picked]: errorMessage(err) })));
    }, 1200);
    return () => clearTimeout(timer);
  }, [picked]);

  async function next() {
    if (!company || picked === null) return;
    setBusy(true);
    setError(null);
    try {
      if (!company.products.find((p) => p.id === picked)?.is_hero) await api.setHero(picked);
      router.push(`/start/setup?company=${company.id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (error && !company) return <Screen><ErrorNote>{error}</ErrorNote></Screen>;

  if (!company) {
    return (
      <Screen>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-4 h-12 w-2/3" />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-52 rounded-3xl" />
          <Skeleton className="h-52 rounded-3xl" />
        </div>
      </Screen>
    );
  }

  const candidates = heroCandidates(company);
  // The demo replays one recorded drug; any other pick would need a live (paid) setup and replay nothing.
  const demoHero = demo ? candidates.find((p) => p.is_hero) : undefined;

  return (
    <Screen>
      <Eyebrow>{company.name || company.domain}</Eyebrow>
      <PageTitle>Which drug should we start with?</PageTitle>
      <Lead>
        {demoHero
          ? `The demo recording starts with ${demoHero.brand}. `
          : "We pre-selected the brand with the most search demand. "}
        One drug makes the first scan faster and the report easier to act on.
      </Lead>

      {candidates.length === 0 ? (
        <ErrorNote className="mt-8" action={<PillButton href={`/start/portfolio?company=${company.id}`} variant="secondary" className="h-10 px-5 text-[14px]">Back to portfolio</PillButton>}>
          None of your own marketed products is ticked. Tick at least one to continue.
        </ErrorNote>
      ) : (
        <div role="radiogroup" aria-label="Hero drug" className="mt-10 grid gap-4 md:grid-cols-2">
          {candidates.map((product) => {
            const active = product.id === picked;
            const locked = demoHero !== undefined && product.id !== demoHero.id;
            const note = locked ? `The demo recording covers ${demoHero.brand} only.` : unavailable[product.id];
            return (
              <button
                key={product.id}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={locked}
                onClick={() => setPicked(product.id)}
                className={cn(
                  "relative flex cursor-pointer flex-col gap-3 rounded-3xl border-2 bg-white p-6 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal disabled:cursor-not-allowed disabled:opacity-55 md:p-7",
                  active ? "border-royal" : "border-transparent shadow-[0_0_0_1px_var(--color-oat)] enabled:hover:shadow-[0_0_0_1px_var(--color-stone)]"
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block font-display text-[30px] leading-none font-medium tracking-[-0.02em]">{product.brand}</span>
                    {product.molecule && <span className="mt-1.5 block text-[15px] text-stone">{product.molecule}</span>}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1 grid size-6 shrink-0 place-items-center rounded-full border-2",
                      active ? "border-royal" : "border-oat"
                    )}
                  >
                    {active && <span className="size-3 rounded-full bg-royal" />}
                  </span>
                </span>
                {product.indication && <span className="text-[15px] leading-[1.45] text-graphite">{product.indication}</span>}
                <ProductBadges product={product} />
                {product.is_hero && <Badge tone="royal" className="w-fit">Suggested</Badge>}
                {note && <span className={cn("text-[14px] leading-[1.4]", locked ? "text-stone" : "text-alert-ink")}>{note}</span>}
              </button>
            );
          })}
        </div>
      )}

      {error && <ErrorNote className="mt-6">{error}</ErrorNote>}

      <ActionBar>
        <p className="hidden text-[14px] text-stone sm:block">Next: competitors and the questions we&apos;ll ask AI</p>
        <PillButton onClick={next} disabled={picked === null || busy} className="ml-auto">
          {busy ? "Saving…" : "Continue"}
        </PillButton>
      </ActionBar>
    </Screen>
  );
}
