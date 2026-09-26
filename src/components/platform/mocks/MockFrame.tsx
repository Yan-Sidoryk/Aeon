"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./mocks.module.css";

export type MockKind = "track" | "verify" | "fix" | "review" | "measure";

type MockFrameProps = {
  kind: MockKind;
  /** Panel background utility, e.g. "bg-periwinkle". */
  className?: string;
  children: ReactNode;
};

/**
 * Root of every platform mock. Owns the panel colour and scales a 520x520 design stage to the box the way 7shifts'
 * Lottie SVGs do (preserveAspectRatio="xMidYMid meet"): the stage is a centred square of 100cqmin and redefines
 * --spacing so every Tailwind spacing utility inside is one design unit (1px when the panel is 520px wide).
 *
 * The entrance plays once, when the mock first scrolls into view (one IntersectionObserver). State lives in a data
 * attribute that the CSS module reads, so there is no re-render. The server render, no-JS, reduced-motion and
 * already-on-screen cases all keep the finished frame.
 */
export function MockFrame({ kind, className, children }: MockFrameProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || el.dataset.state === "play" || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const { top, bottom } = el.getBoundingClientRect();
    if (top < window.innerHeight && bottom > 0) return;

    el.dataset.state = "armed";
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        el.dataset.state = "play";
        observer.disconnect();
      },
      { threshold: 0.45 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      // Never leave a mock hidden if the effect is torn down before it played (Strict Mode, Fast Refresh).
      if (el.dataset.state === "armed") delete el.dataset.state;
    };
  }, []);

  return (
    <div
      ref={ref}
      data-mock={kind}
      aria-hidden="true"
      className={cn(
        "relative aspect-square h-full w-full overflow-hidden select-none [container-type:size]",
        styles.frame,
        className
      )}
    >
      <div className="absolute top-1/2 left-1/2 size-[100cqmin] -translate-x-1/2 -translate-y-1/2 font-sans text-black [--spacing:calc(100cqmin/520)]">
        {children}
      </div>
    </div>
  );
}
