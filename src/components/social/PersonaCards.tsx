"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Length of the flex-grow transition; titles stay truncated until the row has settled back to rest.
const SETTLE_MS = 500;

export type Persona = {
  title: string;
  role: string;
  detail: string;
  image: string;
  alt: string;
  href: string;
};

/**
 * 7shifts' story cards. ≥810px: a 463px-tall row where the hovered (or focused) card grows to flex 2.5, the others
 * shrink to 0.6 (flex-grow 0.5s ease-in-out) and a hidden block (max-height 0 → 300px in 0.4s, opacity 0 → 1 in 0.3s)
 * slides in under the title. Below 810px the cards stack and show everything.
 * Titles: 7shifts always truncates them (nowrap + ellipsis). Aeon lets them wrap while the row is at rest so no
 * title is cut off at 810–1199px, and truncates only while a card is open and until the row has settled back, so
 * narrow collapsed cards never reflow into tall multi-line titles mid-transition.
 */
export function PersonaCards({ personas }: { personas: readonly Persona[] }) {
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

  return (
    <ul className="flex flex-col gap-2.5 self-stretch py-2.5 md:h-[463px] md:flex-row md:gap-[10px] md:py-0">
      {personas.map((persona, i) => {
        const open = active === i;
        return (
          <li
            key={persona.title}
            className={cn(
              // flex-grow is 1 in both layouts (it has no effect in the mobile column) so crossing 810px, e.g. rotating
              // a tablet, never replays the grow transition from 0.
              "relative min-h-[463px] grow overflow-hidden rounded-[10px] md:min-h-0 md:min-w-0 md:shrink md:basis-0 md:[transition:flex-grow_0.5s_ease-in-out]",
              open && "md:grow-[2.5]",
              active !== null && !open && "md:grow-[0.6]",
            )}
          >
            <a
              href={persona.href}
              onMouseEnter={() => openCard(i)}
              onMouseLeave={() => closeCard(i)}
              onFocus={() => openCard(i)}
              onBlur={() => closeCard(i)}
              className="absolute inset-0 block rounded-[10px] text-paper focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-paper"
            >
              <Image
                src={persona.image}
                alt={persona.alt}
                fill
                sizes="(min-width: 810px) 634px, calc(100vw - 80px)"
                className="object-cover object-[50%_15%]"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/80" />
              <div className="absolute inset-0 flex flex-col justify-end gap-4 px-7 py-10 md:gap-3 md:overflow-hidden">
                <p
                  className={cn(
                    "font-display text-[18px] leading-none font-medium",
                    resting ? "md:text-balance" : "md:truncate",
                  )}
                >
                  {persona.title}
                </p>
                <div
                  className={cn(
                    "flex flex-col gap-4 md:gap-3 md:overflow-hidden md:[transition:max-height_0.4s_ease-in-out,opacity_0.3s_ease-in-out]",
                    open ? "md:max-h-[300px] md:opacity-100" : "md:max-h-0 md:opacity-0",
                  )}
                >
                  <p className="text-[18px] leading-[1.5] md:text-[16px]">{persona.detail}</p>
                  <p className="text-[18px] leading-[1.5] font-bold md:text-[16px]">{persona.role}</p>
                </div>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
