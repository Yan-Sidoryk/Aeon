"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type PlatformTab = { id: string; label: string; icon: string };

type PlatformTabBarProps = {
  tabs: readonly PlatformTab[];
  /** id of the section wrapper: the orange bar tracks scroll progress through it. */
  sectionId: string;
  /** id of the flex column that holds the sticky cards (one child per tab, in order). */
  cardsId: string;
};

// 7shifts offsets with the 37px announcement bar shown: cards stick at 220px (= 103 + 80 + 37).
const CARD_STICKY_TOP = 220;
// 7shifts observes cards with rootMargin `-${160 + 37}px 0px -40% 0px` and flips the tab once ratio > 0.1.
const OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
  rootMargin: "-197px 0px -40% 0px",
};
const CLICK_LOCK_MS = 1000;

function getCards(cardsId: string): HTMLElement[] {
  const container = document.getElementById(cardsId);
  return container ? Array.from(container.children).filter((el): el is HTMLElement => el instanceof HTMLElement) : [];
}

/** Document-space top of a card as if it were not sticky (its place in the flex column). */
function naturalTop(cardsId: string, index: number): number | null {
  const container = document.getElementById(cardsId);
  const cards = getCards(cardsId);
  if (!container || !cards[index]) return null;
  const gap = parseFloat(getComputedStyle(container).rowGap) || 0;
  let top = container.getBoundingClientRect().top + window.scrollY;
  for (let i = 0; i < index; i += 1) top += cards[i].offsetHeight + gap;
  return top;
}

export function PlatformTabBar({ tabs, sectionId, cardsId }: PlatformTabBarProps) {
  const [active, setActive] = useState(0);
  const fillRef = useRef<HTMLDivElement>(null);
  const clickLock = useRef(false);
  const unlockTimer = useRef<number | undefined>(undefined);

  // Orange bar: scroll progress through the whole section, -top / (height - viewport height), clamped 0..100%.
  useEffect(() => {
    const section = document.getElementById(sectionId);
    if (!section) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const range = section.offsetHeight - window.innerHeight;
      const progress = range > 0 ? Math.min(Math.max(-section.getBoundingClientRect().top / range, 0), 1) : 0;
      if (fillRef.current) fillRef.current.style.width = `${progress * 100}%`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sectionId]);

  // Active tab: the card with the largest ratio among the entries that just crossed a threshold (7shifts' rule).
  // Ties go to the later card (7shifts keeps the first): when the whole stack scrolls away together every card
  // reports the same ratio, and the frontmost card is the one on screen.
  useEffect(() => {
    const cards = getCards(cardsId);
    const observer = new IntersectionObserver((entries) => {
      if (clickLock.current) return;
      let target: Element | null = null;
      let maxRatio = 0;
      for (const entry of entries) {
        if (entry.intersectionRatio >= maxRatio) {
          maxRatio = entry.intersectionRatio;
          target = entry.target;
        }
      }
      if (target && maxRatio > 0.1) {
        const index = cards.indexOf(target as HTMLElement);
        if (index !== -1) setActive(index);
      }
    }, OBSERVER_OPTIONS);
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [cardsId]);

  useEffect(() => () => window.clearTimeout(unlockTimer.current), []);

  const goTo = (index: number) => {
    clickLock.current = true;
    setActive(index);
    const top = naturalTop(cardsId, index);
    if (top !== null) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: Math.max(0, top - CARD_STICKY_TOP), behavior: reduceMotion ? "auto" : "smooth" });
    }
    window.clearTimeout(unlockTimer.current);
    unlockTimer.current = window.setTimeout(() => {
      clickLock.current = false;
    }, CLICK_LOCK_MS);
  };

  return (
    <nav
      aria-label="Platform steps"
      className="sticky top-[140px] mx-auto mb-[28px] pt-[20px] max-[810px]:hidden min-[810px]:mb-[40px] xl:max-w-[800px]"
    >
      <div className="grid grid-cols-10">
        {tabs.map((tab, i) => {
          const shown = active >= i;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => goTo(i)}
              aria-current={active === i ? "step" : undefined}
              className="col-span-2 flex cursor-pointer justify-center rounded-full py-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 focus-visible:ring-offset-sand"
            >
              <span className="flex items-center gap-[6px]">
                <span
                  className="block overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ width: shown ? "22px" : "0px", opacity: shown ? 1 : 0 }}
                >
                  {/* 7shifts' img shrinks with its wrapper (max-width: 100%); scaleX on the same curve gives the
                      identical squish while the img keeps its 22px box. */}
                  <Image
                    src={tab.icon}
                    alt=""
                    aria-hidden="true"
                    width={22}
                    height={22}
                    className="block h-[22px] w-[22px] max-w-none shrink-0 origin-left p-[3px] transition-transform duration-300 ease-in-out"
                    style={{ transform: shown ? "scaleX(1)" : "scaleX(0)" }}
                  />
                </span>
                <span className="block font-display text-[16px] leading-6 font-medium">{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="relative mt-[4px] h-[3px] bg-sand">
        <div ref={fillRef} className="absolute inset-y-0 left-0 bg-flame" />
      </div>
    </nav>
  );
}
