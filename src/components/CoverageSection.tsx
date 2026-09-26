"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";

// Glass card over the fixed page photo, after 7shifts' "Works with the tools you already love" block
// (docs/research/components/CoverageSection.spec.md). md: / xl: are 7shifts' 810px / 1200px (theme breakpoints).

type EngineId =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "copilot"
  | "metaAi"
  | "grok"
  | "mistral"
  | "openEvidence"
  | "perplexity"
  | "aiOverviews"
  | "aiMode"
  | "dailyMed"
  | "openFda"
  | "veevaPromoMats"
  | "semrush"
  | "ahrefs"
  | "searchConsole";

/** Aeon palette accents. They mark the tile like a logo glyph and are not the vendors' brand colors. */
type DotColor = "bg-royal" | "bg-flame" | "bg-mint" | "bg-violet" | "bg-navy" | "bg-forest" | "bg-ink";

type Engine = {
  name: string;
  /** Wordmark lines, for names that do not fit the tile's 104px content box on one line. */
  lines?: readonly string[];
  dot: DotColor;
};

type CategoryId = "general" | "clinical" | "search" | "label" | "mlr" | "seo";

type Category = {
  id: CategoryId;
  label: string;
  engines: readonly EngineId[];
};

type CoverageContent = {
  heading: string;
  filterLabel: string;
  cta: { label: string; href: string };
  categories: readonly Category[];
};

// Third-party names appear only as plain-text wordmarks: no logo files or vendor artwork.
const ENGINES: Record<EngineId, Engine> = {
  chatgpt: { name: "ChatGPT", dot: "bg-forest" },
  claude: { name: "Claude", dot: "bg-flame" },
  gemini: { name: "Gemini", dot: "bg-royal" },
  copilot: { name: "Copilot", dot: "bg-violet" },
  metaAi: { name: "Meta AI", dot: "bg-navy" },
  grok: { name: "Grok", dot: "bg-ink" },
  mistral: { name: "Mistral", dot: "bg-mint" },
  openEvidence: { name: "OpenEvidence", lines: ["Open", "Evidence"], dot: "bg-forest" },
  perplexity: { name: "Perplexity", dot: "bg-mint" },
  aiOverviews: { name: "Google AI Overviews", lines: ["Google AI", "Overviews"], dot: "bg-royal" },
  aiMode: { name: "Google AI Mode", lines: ["Google AI", "Mode"], dot: "bg-violet" },
  dailyMed: { name: "DailyMed", dot: "bg-navy" },
  openFda: { name: "openFDA", dot: "bg-royal" },
  veevaPromoMats: { name: "Veeva PromoMats", lines: ["Veeva", "PromoMats"], dot: "bg-flame" },
  semrush: { name: "Semrush", dot: "bg-flame" },
  ahrefs: { name: "Ahrefs", dot: "bg-royal" },
  searchConsole: { name: "Google Search Console", lines: ["Google", "Search", "Console"], dot: "bg-mint" },
};

const COVERAGE_CONTENT: CoverageContent = {
  heading: "Tracks every engine your audience asks",
  filterLabel: "Filter engines by category",
  cta: { label: "See coverage", href: "#faqs" },
  categories: [
    {
      id: "general",
      label: "General LLMs",
      engines: ["chatgpt", "claude", "gemini", "copilot", "metaAi", "grok", "mistral"],
    },
    { id: "clinical", label: "Clinical LLMs", engines: ["openEvidence"] },
    { id: "search", label: "AI search", engines: ["perplexity", "aiOverviews", "aiMode"] },
    { id: "label", label: "Label data", engines: ["dailyMed", "openFda"] },
    { id: "mlr", label: "MLR workflow", engines: ["veevaPromoMats"] },
    { id: "seo", label: "SEO data", engines: ["semrush", "ahrefs", "searchConsole"] },
  ],
};

/** 7shifts' measured tile speed in px/s. It is the same for every category, both columns and the mobile row. */
const MARQUEE_SPEED = 88.3;
/** A 120px tile plus 16px spacing. */
const TILE_PITCH = 136;
/** A loop must be longer than the widest tile window (the 769px mobile row) so the seam never shows. */
const MIN_TILES_PER_LOOP = 6;
/** 7shifts fades the card in once 80% of it is on screen. */
const REVEAL_RATIO = 0.8;
const REVEAL_THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

const LIST_ID = "coverage-engines";

/** Repeats a category's engines until one loop is long enough to fill the tile window. */
function buildLoop(engines: readonly EngineId[]): EngineId[] {
  const loop: EngineId[] = [];
  if (engines.length === 0) return loop;
  while (loop.length < MIN_TILES_PER_LOOP) loop.push(...engines);
  return loop;
}

function EngineTile({ engine, className }: { engine: Engine; className: string }) {
  const lines = engine.lines ?? [engine.name];
  return (
    <div
      className={cn(
        "flex size-[120px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-2",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <span className={cn("size-2.5 shrink-0 rounded-full", engine.dot)} />
        <span
          className={cn(
            "font-display font-semibold tracking-tight whitespace-nowrap text-ink",
            lines.length > 1 ? "text-[16px]/[1.05]" : "text-[17px]/[1.05]",
          )}
        >
          {lines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </span>
      </span>
    </div>
  );
}

/** Two back-to-back copies of the loop, so a -50% marquee translate lands exactly on the start of copy two. */
function TileLoop({ loop, tileClassName }: { loop: readonly EngineId[]; tileClassName: string }) {
  return [0, 1].flatMap((copy) =>
    loop.map((id, index) => (
      <EngineTile key={`${copy}-${index}`} engine={ENGINES[id]} className={tileClassName} />
    )),
  );
}

export function CoverageSection() {
  const { heading, filterLabel, cta, categories } = COVERAGE_CONTENT;
  const [activeId, setActiveId] = useState<CategoryId>(categories[0].id);
  const [revealed, setRevealed] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // One-shot fade-in, as on 7shifts. Also reveals a card taller than a short viewport once it fills 80% of it.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const viewportHeight = entry.rootBounds?.height ?? window.innerHeight;
        if (
          entry.intersectionRatio >= REVEAL_RATIO ||
          entry.intersectionRect.height >= viewportHeight * REVEAL_RATIO
        ) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: REVEAL_THRESHOLDS },
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const active = categories.find((category) => category.id === activeId) ?? categories[0];
  const loop = buildLoop(active.engines);
  // Set as a longhand, not through --marquee-duration: the theme's --animate-marquee-* tokens resolve that
  // variable at :root, so a per-element value would be ignored.
  const marqueeStyle: CSSProperties = {
    animationDuration: `${((loop.length * TILE_PITCH) / MARQUEE_SPEED).toFixed(2)}s`,
  };

  return (
    <section
      id="coverage"
      data-section="coverage"
      aria-labelledby="coverage-heading"
      className="relative flex flex-row px-5 pt-[76px] pb-[76px] md:px-20 xl:pt-[100px] xl:pb-[100px]"
    >
      <div
        ref={cardRef}
        className={cn(
          "mx-auto flex w-full flex-col gap-5 rounded-[20px] bg-black/50 py-6 backdrop-blur-lg transition-opacity duration-500",
          "md:flex-row md:gap-10 md:py-0 md:pr-7",
          "xl:max-w-[720px] xl:gap-0",
          revealed ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="flex flex-col items-start gap-10 px-6 md:w-[64%] md:py-12 md:pl-12 xl:w-[52%] xl:items-stretch">
          {/* mb-10 stands in for 7shifts' empty <p>, which takes a second 40px gap under the heading. */}
          <h2
            id="coverage-heading"
            className="mb-10 font-display text-[36px] leading-7 font-medium text-white md:leading-9"
          >
            {heading}
          </h2>

          <div role="group" aria-label={filterLabel} className="flex flex-row flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                aria-pressed={category.id === active.id}
                aria-controls={LIST_ID}
                onClick={() => setActiveId(category.id)}
                className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-offwhite px-4 font-display text-[16px] leading-6 font-medium text-black transition-all hover:brightness-[.85] focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none"
              >
                {category.label}
              </button>
            ))}
          </div>

          <PillButton href={cta.href} className="mx-auto mt-auto xl:ml-0">
            {cta.label}
          </PillButton>
        </div>

        <div className="flex items-center justify-center md:w-[36%] xl:w-[48%]">
          <ul id={LIST_ID} aria-label={active.label} aria-live="polite" className="sr-only">
            {active.engines.map((id) => (
              <li key={id}>{ENGINES[id].name}</li>
            ))}
          </ul>

          {/* Decorative tiles: two vertical columns from 810px, one horizontal row below. */}
          <div
            aria-hidden="true"
            className="my-2 flex w-full gap-4 overflow-hidden md:my-0 md:h-80 md:w-auto xl:h-96"
          >
            <div className="hidden w-[120px] overflow-hidden md:block">
              <div
                key={active.id}
                style={marqueeStyle}
                className="flex animate-marquee-y flex-col [animation-direction:reverse]"
              >
                <TileLoop loop={[...loop].reverse()} tileClassName="mb-4" />
              </div>
            </div>
            <div className="w-full overflow-hidden md:w-[120px]">
              <div
                key={active.id}
                style={marqueeStyle}
                className="flex w-max animate-marquee-x flex-row md:w-auto md:animate-marquee-y md:flex-col"
              >
                <TileLoop loop={loop} tileClassName="mr-4 md:mr-0 md:mb-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
