"use client";

import { Check, ExternalLink, Plus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { PillButton, START_HREF } from "@/components/ui/pill-button";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Company, Product } from "@/types/api";
import { ProductBadges } from "./ProductBadges";
import { ActionBar, Badge, ErrorNote, Eyebrow, Lead, PageTitle, Panel, Screen, Skeleton, Spinner, inputClass } from "./ui";

/** Products that can be scanned first: ticked, ours, launched. */
export function heroCandidates(company: Company): Product[] {
  return company.products.filter((p) => p.selected && !p.partner && !p.pipeline);
}

/** Screen 2, "Here's what we found": confirm the company and untick anything that isn't theirs. */
export function PortfolioScreen({ companyId }: { companyId: number }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load, and keep polling while discovery is still running (a refresh mid-way lands here early).
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function load() {
      try {
        const next = await api.company(companyId);
        if (cancelled) return;
        setCompany(next);
        if (next.status === "discovering") timer = setTimeout(load, 3000);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      }
    }
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [companyId]);

  async function toggle(product: Product) {
    const selected = !product.selected;
    const flip = (value: boolean) =>
      setCompany((c) => c && { ...c, products: c.products.map((p) => (p.id === product.id ? { ...p, selected: value } : p)) });
    flip(selected);
    try {
      await api.setSelected(product.id, selected);
    } catch (err) {
      flip(!selected);
      setError(errorMessage(err));
    }
  }

  if (error && !company) {
    return (
      <Screen>
        <ErrorNote action={<PillButton href={START_HREF} variant="secondary" className="h-10 px-5 text-[14px]">Start over</PillButton>}>
          {error}
        </ErrorNote>
      </Screen>
    );
  }

  if (!company || company.status === "discovering") return <PortfolioSkeleton />;

  if (company.status === "failed") {
    return (
      <Screen>
        <ErrorNote action={<PillButton href={START_HREF} variant="secondary" className="h-10 px-5 text-[14px]">Try another address</PillButton>}>
          We couldn&apos;t finish reading {company.domain}.
        </ErrorNote>
      </Screen>
    );
  }

  const launched = company.products.filter((p) => !p.pipeline);
  const pipeline = company.products.filter((p) => p.pipeline);
  const selectedCount = launched.filter((p) => p.selected).length;
  const canContinue = heroCandidates(company).length > 0;

  return (
    <Screen>
      <Eyebrow>We read your website</Eyebrow>
      <PageTitle>Here&apos;s what we found</PageTitle>
      <Lead>Untick anything that isn&apos;t yours, discontinued or divested. Each product comes with its FDA label.</Lead>

      <CompanyCard company={company} />

      {company.labeler_candidates.length > 1 && <LabelerQuestion company={company} onChange={setCompany} />}

      <h2 className="mt-10 mb-3 text-[14px] font-medium text-stone">
        Marketed products · {launched.length}
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {launched.map((product) => (
          <ProductCard key={product.id} product={product} onToggle={() => toggle(product)} />
        ))}
      </div>

      <AddProduct companyId={company.id} onAdded={setCompany} />

      {pipeline.length > 0 && (
        <details className="group mt-8 rounded-2xl border border-oat/70 bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[15px] font-medium md:px-6">
            <span>
              Pipeline · {pipeline.length} <span className="font-normal text-stone">not approved yet, so not scanned</span>
            </span>
            <Plus className="size-4 shrink-0 transition-transform group-open:rotate-45" />
          </summary>
          <ul className="flex flex-wrap gap-2 px-5 pb-5 md:px-6">
            {pipeline.map((p) => (
              <li key={p.id}>
                <Badge tone="sand" className="h-7 px-3 text-[13px]">
                  {p.brand}
                  {p.molecule && p.molecule.toLowerCase() !== p.brand.toLowerCase() && (
                    <span className="font-normal text-stone">({p.molecule})</span>
                  )}
                </Badge>
              </li>
            ))}
          </ul>
        </details>
      )}

      {error && <ErrorNote className="mt-6">{error}</ErrorNote>}

      <ActionBar>
        <p className="text-[14px] text-stone">
          <span className="font-medium text-black">{selectedCount}</span> of {launched.length} products selected
        </p>
        <PillButton href={canContinue ? `/start/hero?company=${company.id}` : undefined} disabled={!canContinue}>
          Looks right
        </PillButton>
      </ActionBar>
    </Screen>
  );
}

function CompanyCard({ company }: { company: Company }) {
  const labels = company.products.filter((p) => p.label_found).length;
  return (
    <Panel className="mt-8 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <p className="font-display text-[28px] leading-[1.1] font-medium tracking-[-0.02em]">{company.name || company.domain}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-stone">
          <a
            href={`https://${company.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-black underline-offset-4 hover:underline"
          >
            {company.domain}
            <ExternalLink className="size-3.5" />
          </a>
          {company.hq && <span>· {company.hq}</span>}
          {company.company_type && <span>· {company.company_type}</span>}
        </p>
        {company.therapeutic_areas.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {company.therapeutic_areas.map((area) => (
              <Badge key={area} tone="periwinkle">
                {area}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <dl className="flex shrink-0 gap-6 md:text-right">
        <div>
          <dt className="text-[13px] text-stone">Products</dt>
          <dd className="font-display text-[28px] leading-none font-medium">{company.products.filter((p) => !p.pipeline).length}</dd>
        </div>
        <div>
          <dt className="text-[13px] text-stone">FDA labels</dt>
          <dd className="font-display text-[28px] leading-none font-medium">{labels}</dd>
        </div>
      </dl>
    </Panel>
  );
}

function ProductCard({ product, onToggle }: { product: Product; onToggle: () => void }) {
  const molecule = product.molecule && product.molecule.toLowerCase() !== product.brand.toLowerCase() ? product.molecule : "";
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={product.selected}
      onClick={onToggle}
      className={cn(
        "flex w-full cursor-pointer gap-4 rounded-2xl border bg-white p-5 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal",
        product.selected ? "border-royal/55" : "border-oat/70 opacity-75 hover:opacity-100"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 grid size-5 shrink-0 place-items-center rounded-md border-2 transition-colors",
          product.selected ? "border-royal bg-royal text-white" : "border-oat bg-white"
        )}
      >
        {product.selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-2">
        <span>
          <span className="font-display text-[20px] leading-tight font-medium">{product.brand}</span>
          {molecule && <span className="ml-2 text-[14px] text-stone">{molecule}</span>}
        </span>
        {product.indication && <span className="text-[15px] leading-[1.45] text-graphite">{product.indication}</span>}
        <ProductBadges product={product} />
      </span>
    </button>
  );
}

function LabelerQuestion({ company, onChange }: { company: Company; onChange: (company: Company) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(labeler: string) {
    setBusy(labeler);
    setError(null);
    try {
      onChange(await api.chooseLabeler(company.id, labeler));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Panel className="mt-4 border-periwinkle-dark/60 bg-periwinkle/40">
      <p className="font-display text-[20px] font-medium">Which of these are you?</p>
      <p className="mt-1 text-[15px] text-graphite">
        FDA labels for this website list several companies. Products labeled by the others stay visible as partner
        products and aren&apos;t scanned.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {company.labeler_candidates.map((labeler) => (
          <PillButton
            key={labeler}
            variant="secondary"
            disabled={busy !== null}
            onClick={() => choose(labeler)}
            className="h-10 bg-white px-4 text-[14px]"
          >
            {busy === labeler && <Spinner className="mr-2" />}
            {labeler}
          </PillButton>
        ))}
      </div>
      {error && <p className="mt-3 text-[14px] text-alert-ink">{error}</p>}
    </Panel>
  );
}

function AddProduct({ companyId, onAdded }: { companyId: number; onAdded: (company: Company) => void }) {
  const [brand, setBrand] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    const value = brand.trim();
    if (!value) return;
    setBusy(true);
    setMessage(null);
    try {
      const product = await api.addProduct(companyId, value);
      onAdded(await api.company(companyId)); // the add response has no label badges; reload the list
      setBrand("");
      setMessage(`Added ${product.brand}.`);
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={add} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="relative flex-1 sm:max-w-[360px]">
        <span className="sr-only">Brand name</span>
        <input
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Missing one? Type a brand name"
          className={cn(inputClass, "h-11 text-[15px]")}
        />
      </label>
      <PillButton type="submit" variant="secondary" disabled={busy || !brand.trim()} className="h-11 px-5 text-[15px]">
        {busy ? <Spinner className="mr-2" /> : <Plus className="mr-1.5 size-4" />}
        Add product
      </PillButton>
      {message && (
        <p role="status" className="text-[14px] text-stone sm:ml-2">
          {message}
        </p>
      )}
    </form>
  );
}

function PortfolioSkeleton() {
  return (
    <Screen>
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-4 h-12 w-3/4" />
      <Skeleton className="mt-8 h-36 w-full rounded-2xl" />
      <div className="mt-10 grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-[14px] text-stone">
        <Spinner /> Loading your portfolio…
      </p>
    </Screen>
  );
}
