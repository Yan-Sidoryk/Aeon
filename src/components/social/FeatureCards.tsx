"use client";

import { useEffect, useRef, useState } from "react";
import { FEATURE_MOCKS, type FeatureMockId } from "@/components/social/FeatureMocks";
import { cn } from "@/lib/utils";

// Length of the flex-grow transition; titles stay truncated until the row has settled back to rest.
const SETTLE_MS = 500;

export type FeatureCard = {
  title: string;
  role: string;
  detail: string;
  href: string;
  /** Light panel behind the product screen. */
  panel: "bg-lavender" | "bg-periwinkle" | "bg-lime" | "bg-oat";
  mock: FeatureMockId;
};

/**
 * One card per team, each a light panel holding a small product screen, with ink text.
 * ≥1024px: 7shifts' 463px accordion row. The hovered or focused card grows to flex 2.5, the others shrink to 0.6
 * (flex-grow 0.5s ease-in-out), and the detail line slides in under the title (max-height 0.4s, opacity 0.3s).
 * The screen is fluid between 188px and 288px: it is centered in wide cards and bleeds off the right edge of
 * collapsed ones. Below 1024px the cards sit in a 2-column (≥567px) or 1-column grid with everything visible.
 * Titles wrap while the row is at rest and truncate only while a card is open (and until the row has settled),
 * so collapsed cards never reflow into tall titles mid-transition.
 */
export function FeatureCards({ cards }: { cards: readonly FeatureCard[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [resting, setResting] = useState(true);
  const settleTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const openCard = (i: number) => {
    window.clearTimeout(settleTimer.current);
    setResting(false);
    setActive(i);
  };

  const closeCard = (i: number) => {
    setActive((current) => (current === i ? null : current));
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => setResting(true), SETTLE_MS);
  };

  const wrap = resting ? "lg:text-balance" : "lg:truncate";

  return (
    <ul className="grid grid-cols-1 gap-2.5 self-stretch sm:grid-cols-2 lg:flex lg:h-[463px] lg:flex-row">
      {cards.map((card, i) => {
        const open = active === i;
        const { Mock, summary } = FEATURE_MOCKS[card.mock];
        return (
          <li
            key={card.title}
            className={cn(
              // flex-grow is 1 in every layout (it has no effect in the grid) so crossing 1024px never replays the
              // grow transition from 0.
              "relative flex grow overflow-hidden rounded-[10px] lg:min-w-0 lg:shrink lg:basis-0 lg:[transition:flex-grow_0.5s_ease-in-out]",
              card.panel,
              open && "lg:grow-[2.5]",
              active !== null && !open && "lg:grow-[0.6]",
            )}
          >
            <a
              href={card.href}
              onMouseEnter={() => openCard(i)}
              onMouseLeave={() => closeCard(i)}
              onFocus={() => openCard(i)}
              onBlur={() => closeCard(i)}
              className="flex w-full min-w-0 flex-col rounded-[10px] text-ink focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-ink"
            >
              <div
                aria-hidden
                className="flex px-5 pt-6 pb-2 select-none [align-items:safe_center] lg:min-h-0 lg:flex-1 lg:pt-5"
              >
                <div className="mx-auto w-full max-w-[288px] min-w-[188px]">
                  <Mock />
                </div>
              </div>

              <div className="flex flex-col gap-2 px-6 pt-4 pb-7 lg:overflow-hidden">
                <p className={cn("text-[13px] leading-[1.3] font-medium text-ink/60", wrap)}>{card.role}</p>
                {/* 1024–1199: some titles wrap to two lines at rest, so every title reserves two lines to keep the row aligned. */}
                <p className={cn("font-display text-[20px] leading-[1.15] font-medium lg:min-h-[46px] xl:min-h-0", wrap)}>
                  {card.title}
                </p>
                <div
                  className={cn(
                    "lg:overflow-hidden lg:[transition:max-height_0.4s_ease-in-out,opacity_0.3s_ease-in-out]",
                    open ? "lg:max-h-[160px] lg:opacity-100" : "lg:max-h-0 lg:opacity-0",
                  )}
                >
                  <p className="pt-1 text-[16px] leading-[1.5] text-ink/75">{card.detail}</p>
                </div>
              </div>
            </a>
            <p className="sr-only">{summary}</p>
          </li>
        );
      })}
    </ul>
  );
}
