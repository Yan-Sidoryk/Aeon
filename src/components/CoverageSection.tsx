"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { BRANDS, BrandLogo, type BrandId } from "@/components/brand-logos";
import { PillButton } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";

// White card on a full-bleed sand band, after 7shifts' "Works with the tools you already love" block
// (docs/research/components/CoverageSection.spec.md). md: / xl: are 7shifts' 810px / 1200px (theme breakpoints).

type Engine = {
  brand: BrandId;
  /** Name on the tile and in the screen-reader list when it differs from the brand's (one Google logo, two products). */
  label?: string;
};

type CategoryId = "general" | "clinical" | "search" | "label" | "mlr" | "seo";

type Category = {
  id: CategoryId;
  label: string;
  engines: readonly Engine[];
};

type CoverageContent = {
  heading: string;
  filterLabel: string;
  cta: { label: string; href: string };
  categories: readonly Category[];
};

const COVERAGE_CONTENT: CoverageContent = {
  heading: "Tracks every engine your audience asks",
  filterLabel: "Filter engines by category",
  cta: { label: "See coverage", href: "#faqs" },
  categories: [
    {
      id: "general",
      label: "General LLMs",
      engines: [
        { brand: "chatgpt" },
        { brand: "claude" },
        { brand: "gemini" },
        { brand: "copilot" },
        { brand: "metaai" },
        { brand: "grok" },
        { brand: "mistral" },
        { brand: "deepseek" },
      ],
    },
    { id: "clinical", label: "Clinical LLMs", engines: [{ brand: "openevidence" }] },
    {
      id: "search",
      label: "AI search",
      engines: [
        { brand: "perplexity" },
        { brand: "google", label: "Google AI Overviews" },
        { brand: "google", label: "Google AI Mode" },
      ],
    },
    { id: "label", label: "Label data", engines: [{ brand: "dailymed" }, { brand: "openfda" }] },
    { id: "mlr", label: "MLR workflow", engines: [{ brand: "veeva" }] },
    {
      id: "seo",
      label: "SEO data",
      engines: [{ brand: "semrush" }, { brand: "ahrefs" }, { brand: "searchconsole", label: "Search Console" }],
    },
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

/**
 * Soft edges where tiles enter and leave the window (7shifts clips hard, which reads as sliced tiles on a white
 * card): a horizontal fade on the mobile row, a vertical one on the two columns.
 */
const WINDOW_FADE =
  "[mask-image:linear-gradient(to_right,transparent,#000_32px,#000_calc(100%_-_32px),transparent)] md:[mask-image:linear-gradient(to_bottom,transparent,#000_40px,#000_calc(100%_-_40px),transparent)]";

function engineName(engine: Engine): string {
  return engine.label ?? BRANDS[engine.brand].name;
}

/** Repeats a category's engines until one loop is long enough to fill the tile window. */
function buildLoop(engines: readonly Engine[]): Engine[] {
  const loop: Engine[] = [];
  if (engines.length === 0) return loop;
  while (loop.length < MIN_TILES_PER_LOOP) loop.push(...engines);
  return loop;
}

/**
 * Logo (or the shared monogram for tools without an open logo) with the product name under it. The logo sits at a
 * fixed height (pt-7 centres a one-line name) so logos line up across the mobile row; a second line of name
 * ("Google AI Overviews") grows downward.
 */
function EngineTile({ engine, className }: { engine: Engine; className: string }) {
  return (
    <div
      className={cn(
        "flex size-[120px] shrink-0 flex-col items-center gap-2 overflow-hidden rounded-xl border border-oat bg-offwhite px-1.5 pt-7",
        className,
      )}
    >
      <BrandLogo id={engine.brand} variant="color" size={40} alt="" />
      <span className="text-center font-sans text-[12px] leading-[14px] font-medium text-balance text-stone">
        {engineName(engine)}
      </span>
    </div>
  );
}

/** Two back-to-back copies of the loop, so a -50% marquee translate lands exactly on the start of copy two. */
function TileLoop({ loop, tileClassName }: { loop: readonly Engine[]; tileClassName: string }) {
  return [0, 1].flatMap((copy) =>
    loop.map((engine, index) => <EngineTile key={`${copy}-${index}`} engine={engine} className={tileClassName} />),
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
  const marqueeStyle = {
    "--marquee-duration": `${((loop.length * TILE_PITCH) / MARQUEE_SPEED).toFixed(2)}s`,
  } as CSSProperties;

  return (
    // Full-bleed sand band: -mt-10 tucks it under the why sheet's rounded bottom, and the extra 40px of bottom
    // padding sits under the social sheet's rounded top, so both neighbours' corners show sand (7shifts' stack).
    <section
      id="coverage"
      data-section="coverage"
      aria-labelledby="coverage-heading"
      className="relative z-10 -mt-10 flex flex-row bg-sand px-5 pt-[116px] pb-[116px] md:px-20 xl:pt-[140px] xl:pb-[140px]"
    >
      <div
        ref={cardRef}
        className={cn(
          "mx-auto flex w-full flex-col gap-5 rounded-[20px] bg-white py-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.12)] transition-opacity duration-500",
          "md:flex-row md:gap-10 md:py-0 md:pr-7",
          "xl:max-w-[720px] xl:gap-0",
          revealed ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="flex flex-col items-start gap-10 px-6 md:w-[64%] md:py-12 md:pl-12 xl:w-[52%] xl:items-stretch">
          {/* mb-10 stands in for 7shifts' empty <p>, which takes a second 40px gap under the heading. */}
          <h2 id="coverage-heading" className="mb-10 font-display text-[36px] leading-9 font-medium text-ink">
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
                className="flex h-10 cursor-pointer items-center justify-center rounded-full bg-sand px-4 font-display text-[16px] leading-6 font-medium text-ink transition-all hover:bg-oat focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none aria-pressed:bg-oat"
              >
                {category.label}
              </button>
            ))}
          </div>

          <PillButton href={cta.href} className="mx-auto mt-auto xl:ml-0">
            {cta.label}
          </PillButton>
        </div>

        {/* min-w-64 keeps the 256px tile window whole at 810-890px, where 7shifts squeezes tiles to 104px. */}
        <div className="flex items-center justify-center md:w-[36%] md:min-w-64 xl:w-[48%]">
          <ul id={LIST_ID} aria-label={active.label} aria-live="polite" className="sr-only">
            {active.engines.map((engine) => (
              <li key={engineName(engine)}>{engineName(engine)}</li>
            ))}
          </ul>

          {/* Decorative tiles: two vertical columns from 810px, one horizontal row below. */}
          <div
            aria-hidden="true"
            className={cn("my-2 flex w-full gap-4 overflow-hidden md:my-0 md:h-80 md:w-auto xl:h-96", WINDOW_FADE)}
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
