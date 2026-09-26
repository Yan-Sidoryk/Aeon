import { FileText, Plus, Send, TriangleAlert } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { BrandLogo, BRANDS, type BrandId } from "@/components/brand-logos";
import { CheckCircleIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

// Small product screens for the feature cards. Illustrative placeholders only: no real brands, scores or answers.
// Each mock is a white window that stays legible from 188px (resting card at 1024px) to 288px wide; rows never wrap
// so the accordion can resize them smoothly. They are decorative (the card renders `summary` for screen readers).

export type FeatureMockId = "prompts" | "dose" | "review" | "brands";

type Bar = { label: string; value: number; width: string; fill: string };
type LostPrompt = { engine: BrandId; prompt: string };
type ClientBrand = { initial: string; name: string; score: number; width: string; tint: string };

const PROMPTS_COPY: { title: string; tag: string; bars: readonly Bar[]; lost: string; winner: string; prompts: readonly LostPrompt[] } = {
  title: "Share of voice",
  tag: "Eczema",
  bars: [
    { label: "You", value: 34, width: "w-[34%]", fill: "bg-royal" },
    { label: "Competitor X", value: 71, width: "w-[71%]", fill: "bg-ink" },
  ],
  lost: "3 prompts lost",
  winner: "Comp. X",
  prompts: [
    { engine: "chatgpt", prompt: "Best treatment for moderate eczema?" },
    { engine: "perplexity", prompt: "Eczema biologic for adults" },
    { engine: "gemini", prompt: "[Brand] vs Competitor X" },
  ],
};

const DOSE_COPY: {
  engine: BrandId;
  flag: string;
  aiLabel: string;
  labelLabel: string;
  lead: string;
  wrong: string;
  right: string;
  routed: string;
} = {
  engine: "gemini",
  flag: "Wrong dose",
  aiLabel: "AI answer",
  labelLabel: "Label · PI §2.1",
  lead: "Take [Brand] ",
  wrong: "300 mg twice daily",
  right: "150 mg once daily",
  routed: "Routed to Medical Information",
};

const REVIEW_COPY: { title: string; sub: string; scoreLabel: string; risk: string; checks: readonly string[]; secondary: string; primary: string } = {
  title: "Draft: [Brand] dosing FAQ",
  sub: "Pre-MLR check",
  scoreLabel: "Risk score",
  risk: "Risk: Low",
  checks: ["4/4 claims referenced", "Fair balance included", "Safety info included"],
  secondary: "Comment",
  primary: "Approve",
};

const BRANDS_COPY: { title: string; metric: string; brands: readonly ClientBrand[]; add: string } = {
  title: "All client brands",
  metric: "Visibility",
  brands: [
    { initial: "A", name: "Brand A", score: 62, width: "w-[62%]", tint: "bg-lavender" },
    { initial: "B", name: "Brand B", score: 48, width: "w-[48%]", tint: "bg-periwinkle" },
    { initial: "C", name: "Brand C", score: 71, width: "w-[71%]", tint: "bg-lime" },
  ],
  add: "Add a client website",
};

function Window({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[226px] flex-col rounded-xl bg-white p-3.5 text-ink shadow-[0_1px_2px_rgb(0_0_0/0.05),0_12px_30px_-10px_rgb(0_0_0/0.2)]">
      {children}
    </div>
  );
}

function PromptsMock() {
  const c = PROMPTS_COPY;
  return (
    <Window>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] leading-none font-medium">{c.title}</p>
        <span className="rounded-full bg-sand px-2 py-1 text-[10px] leading-none text-stone">{c.tag}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {c.bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-2">
            <span className="w-[72px] shrink-0 truncate text-[11px] leading-none">{bar.label}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
              <span className={cn("block h-full rounded-full", bar.fill, bar.width)} />
            </span>
            <span className="w-5 shrink-0 text-right text-[11px] leading-none font-medium tabular-nums">{bar.value}</span>
          </div>
        ))}
      </div>
      <div className="my-3 h-px bg-black/[0.07]" />
      <p className="flex items-center gap-1.5 text-[11px] leading-none font-medium">
        <span className="size-1.5 rounded-full bg-flame" />
        {c.lost}
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {c.prompts.map((row) => (
          <li key={row.prompt} className="flex h-7 items-center gap-2 rounded-md bg-offwhite px-2">
            <BrandLogo id={row.engine} size={12} alt="" />
            <span className="min-w-0 flex-1 truncate text-[10.5px] leading-none">{row.prompt}</span>
            <span className="shrink-0 rounded-full bg-stone/12 px-1.5 py-[3px] text-[9px] leading-none font-medium text-graphite">
              {c.winner}
            </span>
          </li>
        ))}
      </ul>
    </Window>
  );
}

function DoseMock() {
  const c = DOSE_COPY;
  return (
    <Window>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[12px] leading-none font-medium">
          <BrandLogo id={c.engine} size={14} alt="" />
          {BRANDS[c.engine].name}
        </span>
        <span className="flex items-center gap-1 rounded-full bg-[#fff0f1] px-2 py-1 text-[10px] leading-none font-medium text-[#b3263a]">
          <TriangleAlert className="size-2.5" strokeWidth={2.5} />
          {c.flag}
        </span>
      </div>
      <div className="mt-3 rounded-lg bg-[#fff5f6] px-2.5 py-2">
        <p className="text-[9.5px] leading-none font-medium tracking-wide text-[#b3263a] uppercase">{c.aiLabel}</p>
        <p className="mt-1.5 text-[11.5px] leading-[1.4]">
          {c.lead}
          <span className="whitespace-nowrap text-[#b3263a] line-through decoration-[1.5px]">{c.wrong}</span>
        </p>
      </div>
      <div className="mt-1.5 mb-3 rounded-lg bg-mint/[0.14] px-2.5 py-2">
        <p className="text-[9.5px] leading-none font-medium tracking-wide text-forest uppercase">{c.labelLabel}</p>
        <p className="mt-1.5 text-[11.5px] leading-[1.4]">
          {c.lead}
          <span className="rounded-[3px] bg-mint/35 px-0.5 font-medium whitespace-nowrap text-forest">{c.right}</span>
        </p>
      </div>
      <p className="mt-auto flex items-center gap-1.5 border-t border-black/[0.07] pt-2.5 text-[10.5px] leading-none text-stone">
        <Send className="size-3" strokeWidth={2} />
        {c.routed}
      </p>
    </Window>
  );
}

function ReviewMock() {
  const c = REVIEW_COPY;
  return (
    <Window>
      <div className="flex items-center gap-2">
        <span className="grid size-7 shrink-0 place-items-center rounded-md bg-lavender text-eggplant">
          <FileText className="size-3.5" strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[12px] leading-none font-medium">{c.title}</span>
          <span className="mt-1 block text-[10px] leading-none text-stone">{c.sub}</span>
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between rounded-lg bg-offwhite px-2.5 py-2">
        <span className="text-[11px] leading-none text-stone">{c.scoreLabel}</span>
        <span className="rounded-full bg-mint/25 px-2 py-1 text-[10px] leading-none font-semibold text-forest">{c.risk}</span>
      </div>
      <ul className="mt-2.5 flex flex-col gap-2">
        {c.checks.map((check) => (
          <li key={check} className="flex items-center gap-1.5 text-[11px] leading-none">
            <CheckCircleIcon className="size-3.5 shrink-0 text-forest" />
            {check}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex gap-1.5 pt-3">
        <span className="flex h-7 flex-1 items-center justify-center rounded-full border border-black/10 text-[11px] leading-none font-medium">
          {c.secondary}
        </span>
        <span className="flex h-7 flex-1 items-center justify-center rounded-full bg-royal text-[11px] leading-none font-medium text-white">
          {c.primary}
        </span>
      </div>
    </Window>
  );
}

function BrandsMock() {
  const c = BRANDS_COPY;
  return (
    <Window>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] leading-none font-medium">{c.title}</p>
        <span className="text-[10px] leading-none text-stone">{c.metric}</span>
      </div>
      <ul className="mt-3 mb-3 flex flex-col gap-1.5">
        {c.brands.map((brand) => (
          <li key={brand.name} className="flex h-8 items-center gap-2 rounded-md bg-offwhite px-2">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-[5px] text-[10px] leading-none font-semibold",
                brand.tint,
              )}
            >
              {brand.initial}
            </span>
            <span className="w-[50px] shrink-0 text-[11px] leading-none font-medium">{brand.name}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/[0.07]">
              <span className={cn("block h-full rounded-full bg-royal", brand.width)} />
            </span>
            <span className="w-5 shrink-0 text-right text-[11px] leading-none font-medium tabular-nums">{brand.score}</span>
          </li>
        ))}
      </ul>
      <p className="mt-auto flex h-8 items-center justify-center gap-1.5 rounded-md border border-dashed border-black/15 text-[10.5px] leading-none text-stone">
        <Plus className="size-3" strokeWidth={2.25} />
        {c.add}
      </p>
    </Window>
  );
}

export const FEATURE_MOCKS: Record<FeatureMockId, { Mock: ComponentType; summary: string }> = {
  prompts: {
    Mock: PromptsMock,
    summary:
      "Example screen: share of voice for eczema prompts, you 34 and Competitor X 71, with 3 prompts lost to Competitor X on ChatGPT, Perplexity and Gemini.",
  },
  dose: {
    Mock: DoseMock,
    summary:
      "Example screen: Gemini says take [Brand] 300 mg twice daily; the label says 150 mg once daily. The mismatch is routed to Medical Information.",
  },
  review: {
    Mock: ReviewMock,
    summary:
      "Example screen: a draft FAQ with a low pre-MLR risk score, every claim referenced, fair balance and safety information included, ready to approve.",
  },
  brands: {
    Mock: BrandsMock,
    summary: "Example screen: visibility across client brands, Brand A 62, Brand B 48 and Brand C 71.",
  },
};
