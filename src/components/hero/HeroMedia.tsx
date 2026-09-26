"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type Ref } from "react";
import { HERO_CONTENT } from "@/components/hero/hero.content";
import styles from "@/components/hero/Hero.module.css";
import { cn } from "@/lib/utils";

// 7shifts: div.rounded-[20px].overflow-hidden > div.relative.group.w-full.h-full > video.w-full.h-full.object-cover
// (1120 x 630 at 1440). Aeon layers HTML UI cards over the footage instead of baking them into the video.

const { media, cards } = HERO_CONTENT;

type CSSVars = CSSProperties & Record<`--${string}`, string>;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

// Scan card timing: count up to the total, hold, then start a fresh scan from 0.
const SCAN_WAIT = 1400;
const SCAN_RUN = 5200;
const SCAN_HOLD = 1400;

function easeInOut(p: number) {
  return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
}

// Card chrome shared by the three overlays. Everything is in em so the cards scale with the frame
// (1em = 16px when the frame is 1120px wide, like UI baked into footage; floored at 10px for legibility).
const CARD =
  "rounded-[0.875em] bg-white p-[1em] text-black shadow-[0_0.75em_2em_-0.75em_rgba(20,21,21,0.3),0_0.125em_0.375em_rgba(20,21,21,0.08)]";
const CARD_TITLE = "text-[0.875em] leading-[1.25] font-semibold tracking-[-0.01em]";
const CARD_CAPTION = "text-[0.6875em] leading-[1.3] text-stone";

function OverlayCard({
  className,
  delay,
  floatDuration,
  floatDelay,
  children,
}: {
  className: string;
  delay: string;
  floatDuration: string;
  floatDelay: string;
  children: ReactNode;
}) {
  const vars: CSSVars = { "--card-delay": delay, "--float-duration": floatDuration, "--float-delay": floatDelay };
  return (
    <div className={cn("absolute", styles.cardIn, className)} style={vars}>
      <div className={cn(CARD, styles.float)}>{children}</div>
    </div>
  );
}

function VisibilityCard() {
  const { title, caption, rows } = cards.visibility;
  return (
    <OverlayCard
      className="top-[3.25em] left-[3em] w-[18.75em] max-[639px]:invisible"
      delay="350ms"
      floatDuration="7s"
      floatDelay="-1.5s"
    >
      <p className={CARD_TITLE}>{title}</p>
      <p className={cn(CARD_CAPTION, "mt-[0.25em]")}>{caption}</p>
      <div className="mt-[0.875em] space-y-[0.625em]">
        {rows.map((row, i) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between text-[0.75em] leading-[1.3] font-medium">
              <span>{row.label}</span>
              <span className="font-semibold tabular-nums">{row.value}%</span>
            </div>
            <div className="mt-[0.375em] h-[0.5em] overflow-hidden rounded-full bg-sand">
              <div
                className={cn("h-full rounded-full", row.tone === "brand" ? "bg-royal" : "bg-stone", styles.barGrow)}
                style={{ width: `${row.value}%`, "--bar-delay": `${900 + i * 120}ms` } as CSSVars}
              />
            </div>
          </div>
        ))}
      </div>
    </OverlayCard>
  );
}

function AccuracyCard() {
  const { title, finding, sources, action } = cards.accuracy;
  return (
    <OverlayCard
      className="top-[15em] left-[6em] w-[18em] max-[639px]:invisible"
      delay="550ms"
      floatDuration="8s"
      floatDelay="-4s"
    >
      <div className="flex items-center justify-between">
        <p className={CARD_TITLE}>{title}</p>
        <span className="text-[0.75em] leading-[1.25] font-semibold text-royal">{action}</span>
      </div>
      <div className="mt-[0.75em] flex items-start gap-[0.625em] rounded-[0.5em] border border-[#ecebe8] p-[0.75em]">
        <span className="mt-[0.3125em] size-[0.5em] shrink-0 rounded-full bg-[#ef4444] shadow-[0_0_0_0.1875em_rgba(239,68,68,0.18)]" />
        <div>
          <p className="text-[0.8125em] leading-[1.3] font-medium">{finding}</p>
          <p className={cn(CARD_CAPTION, "mt-[0.25em]")}>{sources}</p>
        </div>
      </div>
    </OverlayCard>
  );
}

function ScanCard({ countRef, barRef }: { countRef: Ref<HTMLSpanElement>; barRef: Ref<HTMLDivElement> }) {
  const { title, label, done, total } = cards.scan;
  return (
    <OverlayCard
      className="top-[10px] left-[10px] w-[13em] max-[639px]:text-[length:min(11px,calc(100cqw/32))] min-[640px]:top-[24.5em] min-[640px]:left-[3em] min-[640px]:w-[17em]"
      delay="750ms"
      floatDuration="6.5s"
      floatDelay="-2.5s"
    >
      <div className="flex items-center gap-[0.5em]">
        <span className={cn("size-[0.75em] shrink-0 rounded-full border-[0.125em] border-royal/20 border-t-royal", styles.spin)} />
        <p className={CARD_TITLE}>{title}</p>
      </div>
      <div className="mt-[0.75em] flex items-baseline justify-between text-[0.75em] leading-[1.3]">
        <span className="text-stone">{label}</span>
        <span className="font-semibold tabular-nums">
          <span ref={countRef}>{done}</span> / {total}
        </span>
      </div>
      <div className="mt-[0.5em] h-[0.375em] overflow-hidden rounded-full bg-sand">
        <div
          ref={barRef}
          className="h-full w-full origin-left rounded-full bg-royal"
          style={{ transform: `scaleX(${done / total})` }}
        />
      </div>
    </OverlayCard>
  );
}

function PauseGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
      <rect x="3.5" y="2.5" width="3" height="11" rx="1" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="1" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M4.5 2.9a1 1 0 0 1 1.52-.85l7.1 4.6a1.6 1.6 0 0 1 0 2.7l-7.1 4.6A1 1 0 0 1 4.5 13.1V2.9Z" />
    </svg>
  );
}

export function HeroMedia() {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const scan = useRef({ t: -SCAN_WAIT, from: cards.scan.done });

  const reducedMotion = useReducedMotion();
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [inView, setInView] = useState(true);
  const paused = userPaused ?? reducedMotion;
  const running = !paused && inView;

  // Only spend frames while the frame is on screen.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "120px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Keep the video in sync with the pause control, reduced motion and visibility.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    if (running) {
      video.play().catch(() => {
        /* autoplay refused: the poster stays up */
      });
    } else {
      video.pause();
    }
  }, [running]);

  // "Reading answers 128 / 200": rAF loop writing straight to the DOM (no re-renders).
  useEffect(() => {
    const countEl = countRef.current;
    const barEl = barRef.current;
    if (!running || !countEl || !barEl) return;
    const { total } = cards.scan;
    let raf = 0;
    let last = -1;
    let shown = -1;
    const frame = (now: number) => {
      const s = scan.current;
      if (last >= 0) s.t += Math.min(now - last, 100);
      last = now;
      if (s.t >= SCAN_RUN + SCAN_HOLD) {
        s.t = 0;
        s.from = 0;
      }
      const value = s.from + (total - s.from) * easeInOut(Math.min(Math.max(s.t, 0) / SCAN_RUN, 1));
      const count = Math.round(value);
      if (count !== shown) {
        countEl.textContent = String(count);
        shown = count;
      }
      barEl.style.transform = `scaleX(${value / total})`;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <div
      ref={frameRef}
      className={cn(
        "@container relative isolate aspect-video overflow-hidden rounded-[20px] bg-sand",
        paused && styles.paused,
      )}
    >
      <div className="group relative h-full w-full rounded-[inherit]">
        <video
          ref={videoRef}
          className="block h-full w-full rounded-[inherit] object-cover"
          src={media.src}
          poster={media.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        />

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 font-sans text-[length:max(10px,calc(100cqw/70))]">
          <VisibilityCard />
          <AccuracyCard />
          <ScanCard countRef={countRef} barRef={barRef} />
        </div>

        <button
          type="button"
          onClick={() => setUserPaused(!paused)}
          aria-label={paused ? media.playLabel : media.pauseLabel}
          className={cn(
            "absolute right-3 bottom-3 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/85 text-black shadow-[0_1px_4px_rgba(20,21,21,0.18)] backdrop-blur-sm transition-opacity duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal",
            paused ? "opacity-100" : "opacity-0",
          )}
        >
          {paused ? <PlayGlyph /> : <PauseGlyph />}
        </button>
      </div>
    </div>
  );
}
