"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./reveal.module.css";

// Static classes so Tailwind emits them: card n waits n * 150ms (7shifts' stagger).
const REVEAL_DELAYS = ["delay-0", "delay-150", "delay-300"] as const;

// Measured on 7shifts: in the desktop row a card reveals once ~35% of it is visible; in the stacked mobile
// layout each card reveals as soon as ~5% of it is visible. The layout switches at 7shifts' md (810px).
const DESKTOP_QUERY = "(min-width: 810px)";
const DESKTOP_THRESHOLD = 0.35;
const MOBILE_THRESHOLD = 0.05;

type RevealCardProps = {
  index: number;
  className?: string;
  children: ReactNode;
};

/** A timeline card (`<li>`) that fades up once it is sufficiently inside the viewport. */
export function RevealCard({ index, className, children }: RevealCardProps) {
  const ref = useRef<HTMLLIElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Same semantics as framer-motion's whileInView with `once`: the observer fires when the threshold is
    // crossed (or immediately on mount if the card is already on screen) and the reveal never replays.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: window.matchMedia(DESKTOP_QUERY).matches ? DESKTOP_THRESHOLD : MOBILE_THRESHOLD },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <li
      ref={ref}
      data-revealed={revealed ? "" : undefined}
      className={cn(styles.card, REVEAL_DELAYS[index] ?? "delay-0", className)}
    >
      {children}
    </li>
  );
}
