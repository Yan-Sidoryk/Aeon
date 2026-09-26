"use client";

import { BadgeCheck, MessageCircleQuestionMark, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { api, errorMessage } from "@/lib/api";
import { AUDIENCE_SINGULAR } from "@/lib/format";
import { loadSetup, stopListening } from "@/lib/setup-cache";
import { cn } from "@/lib/utils";
import type { Company, Competitor, Product, QuestionKind, SetupView, StepEvent } from "@/types/api";
import { heroCandidates } from "./PortfolioScreen";
import { StepChecklist } from "./StepChecklist";
import { ActionBar, Badge, ErrorNote, Eyebrow, Lead, PageTitle, Panel, Screen, SectionTitle, Skeleton, inputClass } from "./ui";

// What each group of questions measures. "Lane" never appears in the UI.
const GROUPS: { kind: QuestionKind; title: (brand: string) => string; note: string }[] = [
  { kind: "unbranded", title: () => "Questions that name no drug", note: "Where AI decides what to recommend on its own." },
  { kind: "branded", title: (brand) => `About ${brand}`, note: "Checked against your FDA label." },
  { kind: "comparison", title: (brand) => `${brand} vs competitors`, note: "Checked against your FDA label." },
];

/** Screen 4, "Who you're up against and what people ask": glance, maybe drop a competitor, run the scan. */
export function SetupScreen({ companyId }: { companyId: number }) {
  const router = useRouter();
  const [hero, setHero] = useState<Product | null>(null);
  const [setup, setSetup] = useState<SetupView | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [steps, setSteps] = useState<StepEvent[]>([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let listener: { id: number; fn: (steps: StepEvent[]) => void } | null = null;
    (async () => {
      try {
        const company: Company = await api.company(companyId);
        const product = company.products.find((p) => p.is_hero) ?? heroCandidates(company)[0];
        if (!product) throw new Error("Pick a hero drug first.");
        if (cancelled) return;
        setHero(product);
        const listen = (next: StepEvent[]) => !cancelled && setSteps(next);
        listener = { id: product.id, fn: listen };
        const view = await loadSetup(product.id, listen); // joins the run the hero screen started
        if (cancelled) return;
        setSetup(view);
        setCompetitors(view.competitors);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
      if (listener) stopListening(listener.id, listener.fn);
    };
  }, [companyId, attempt]);

  async function remove(competitor: Competitor) {
    setCompetitors((list) => list.filter((c) => c.id !== competitor.id));
    try {
      await api.deleteCompetitor(competitor.id);
    } catch (err) {
      setCompetitors((list) => [...list, competitor]);
      setError(errorMessage(err));
    }
  }

  async function run() {
    if (!hero) return;
    setStarting(true);
    setError(null);
    try {
      const { scan_id } = await api.startScan(hero.id);
      router.push(`/start/scan?scan=${scan_id}`);
    } catch (err) {
      setError(errorMessage(err));
      setStarting(false);
    }
  }

  const retry = () => {
    setError(null);
    setAttempt((n) => n + 1);
  };

  if (!setup) {
    return (
      <Screen>
        <Eyebrow>{hero ? hero.brand : "Setting up"}</Eyebrow>
        <PageTitle>Who you&apos;re up against and what people ask</PageTitle>
        {error ? (
          <ErrorNote className="mt-8" action={<PillButton variant="secondary" onClick={retry} className="h-10 px-5 text-[14px]">Try again</PillButton>}>
            {error}
          </ErrorNote>
        ) : (
          <>
            <p className="mt-6 max-w-[640px] text-[15px] text-stone">
              Our setup agent is checking competitors against their FDA labels and pulling the questions people really ask
              Google. About a minute the first time.
            </p>
            <Panel className="mt-6 max-w-[720px]">
              <StepChecklist
                rows={
                  steps.length
                    ? steps.slice(-8).map((st, i, arr) => ({
                        key: st.key,
                        label: st.label,
                        status: st.status === "active" || (i === arr.length - 1 && st.status !== "done") ? "active" : "done",
                      }))
                    : [{ key: "wait", label: `Researching ${hero?.brand ?? "your drug"}…`, status: "active" }]
                }
              />
            </Panel>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.6fr]">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-64 rounded-2xl" />
            </div>
          </>
        )}
      </Screen>
    );
  }


  return (
    <Screen>
      <Eyebrow>{hero?.brand}</Eyebrow>
      <PageTitle>Who you&apos;re up against and what people ask</PageTitle>
      <Lead>
        We&apos;ll ask AI {setup.prompts.length} questions about {hero?.brand} and its condition, and track these competitors in every
        answer.
      </Lead>

      <div className="mt-10 grid items-start gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Panel className="lg:sticky lg:top-24">
          <SectionTitle className="text-[20px] md:text-[20px]">Competitors</SectionTitle>
          <p className="mt-1 text-[14px] text-stone">Drugs with the same indication. Remove any that don&apos;t fit.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {competitors.map((c) => (
              <li key={c.id}>
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand py-1 pr-1 pl-3.5 text-[14px] font-medium">
                  {c.source === "openfda" && (
                    <BadgeCheck className="size-4 text-forest" aria-label="Verified against its FDA label" />
                  )}
                  {c.brand}
                  <button
                    type="button"
                    onClick={() => remove(c)}
                    aria-label={`Remove ${c.brand}`}
                    className="grid size-7 cursor-pointer place-items-center rounded-full text-stone transition-colors hover:bg-oat hover:text-black focus-visible:outline-2 focus-visible:outline-royal"
                  >
                    <X className="size-3.5" strokeWidth={2.5} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {hero && <AddCompetitor productId={hero.id} onAdded={(c) => setCompetitors((list) => [...list, c])} />}
          <p className="mt-5 flex items-center gap-1.5 text-[13px] text-stone">
            <BadgeCheck className="size-3.5 text-forest" /> Verified against its FDA label
          </p>

          <details className="group mt-6 border-t border-oat/70 pt-4">
            <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-medium">
              Markets and languages
              <Plus className="size-4 transition-transform group-open:rotate-45" />
            </summary>
            <p className="mt-2 text-[14px] text-stone">
              {setup.markets.join(", ")} · {setup.languages.map((l) => (l === "en" ? "English" : l)).join(", ")}
            </p>
          </details>
        </Panel>

        <Panel>
          <SectionTitle className="text-[20px] md:text-[20px]">Questions we&apos;ll ask AI</SectionTitle>
          <p className="mt-1 text-[14px] text-stone">
            Real questions people ask Google where we could find them, the rest written from your label.
          </p>
          <div className="mt-5 flex flex-col gap-6">
            {GROUPS.map((group) => {
              const items = setup.prompts.filter((p) => p.kind === group.kind);
              if (items.length === 0) return null;
              return (
                <section key={group.kind}>
                  <h3 className="text-[15px] font-medium">
                    {group.title(hero?.brand ?? "Your drug")} <span className="font-normal text-stone">· {items.length}</span>
                  </h3>
                  <p className="mb-2 text-[13px] text-stone">{group.note}</p>
                  <ul className="flex flex-col gap-1.5">
                    {items.map((p) => (
                      <li key={p.id} className="flex items-start gap-3 rounded-xl bg-offwhite px-4 py-3 text-[15px] leading-[1.4]">
                        <MessageCircleQuestionMark className="mt-0.5 size-4 shrink-0 text-royal" />
                        <span className="min-w-0 flex-1">
                          {p.text}
                          <span className="mt-1.5 flex flex-wrap gap-1.5">
                            <Badge tone="white">{AUDIENCE_SINGULAR[p.audience]}</Badge>
                            {p.source === "google_paa" && <Badge tone="lime">Asked on Google</Badge>}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </Panel>
      </div>

      {error && <ErrorNote className="mt-6">{error}</ErrorNote>}

      <ActionBar>
        <p className="hidden text-[14px] text-stone sm:block">
          {setup.prompts.length} questions · {competitors.length} competitors · Claude, Google AI Overviews and AI Mode · about 3 minutes
        </p>
        <PillButton onClick={run} disabled={starting} className="ml-auto">
          {starting ? "Starting…" : "Run my first scan"}
        </PillButton>
      </ActionBar>
    </Screen>
  );
}

function AddCompetitor({ productId, onAdded }: { productId: number; onAdded: (c: Competitor) => void }) {
  const [open, setOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(event: FormEvent) {
    event.preventDefault();
    const value = brand.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      onAdded(await api.addCompetitor(productId, value));
      setBrand("");
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border border-dashed border-oat px-3.5 text-[14px] font-medium text-stone transition-colors hover:border-stone hover:text-black"
      >
        <Plus className="size-4" /> Add
      </button>
    );
  }
  return (
    <form onSubmit={add} className="mt-3 flex gap-2">
      <input
        autoFocus
        value={brand}
        onChange={(e) => setBrand(e.target.value)}
        placeholder="Brand name"
        aria-label="Competitor brand name"
        className={cn(inputClass, "h-10 text-[15px]")}
      />
      <PillButton type="submit" variant="secondary" disabled={busy || !brand.trim()} className="h-10 px-4 text-[14px]">
        Add
      </PillButton>
      {error && <p className="text-[13px] text-alert-ink">{error}</p>}
    </form>
  );
}
