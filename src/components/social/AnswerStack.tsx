"use client";

import Image from "next/image";
import { Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BrandLogo, BRANDS, type BrandId } from "@/components/brand-logos";
import { cn } from "@/lib/utils";
import styles from "./social.module.css";

// A brand mention inside the answer text. `you` marks the viewer's own brand.
type Mention = { mention: string; rank: 1 | 2; you?: boolean };
type AnswerPart = string | Mention;

type AnswerStackCopy = {
  /** Screen-reader summary of the decorative stack. */
  summary: string;
  front: {
    engine: BrandId;
    question: string;
    answer: readonly AnswerPart[];
    sources: string;
  };
  middle: { engine: BrandId; flag: string; line: string };
  back: { engine: BrandId };
};

// Illustrative placeholders only: no real brand, answer or source.
const COPY: AnswerStackCopy = {
  summary:
    "Example: asked for the best treatment for moderate eczema in adults, ChatGPT names Competitor X first and [Brand] second, citing 4 sources. Perplexity and Gemini answer the same question.",
  front: {
    engine: "chatgpt",
    question: "What's the best treatment for moderate eczema in adults?",
    answer: [
      "For most adults, dermatologists start with ",
      { mention: "Competitor X", rank: 1 },
      ", then switch to ",
      { mention: "[Brand]", rank: 2, you: true },
      " if symptoms don't…",
    ],
    sources: "Sources: 4",
  },
  middle: { engine: "perplexity", flag: "[Brand] missing", line: "Competitor X is the most prescribed option for…" },
  back: { engine: "gemini" },
};

const STICKER = "/images/doodles/doodle-phone.png";

// White fill traced from the doodle's own phone silhouette (240×240 canvas, eroded 2px so it hides under the ink):
// the PNG's phone body is transparent, and a sticker reads as a filled cut-out.
const STICKER_FILL =
  "M102 2L82 5L64 11L60 15L51 32L43 79L44 91L41 107L39 179L42 210L47 221L52 226L70 235L99 237L110 237L144 232L152 228L157 223L162 204L163 187L167 170L168 99L171 96L183 94L192 88L198 79L199 63L195 51L186 40L168 32L167 24L160 14L146 7L110 2Z";

// Everything inside the stage is sized in stage units: --spacing is 1/384 of the stack width (1px on desktop), so
// the whole composition scales down on phones instead of overflowing.
const T8 = "text-[length:calc(var(--spacing)*8)]";
const T10 = "text-[length:calc(var(--spacing)*10)]";
const T11 = "text-[length:calc(var(--spacing)*11)]";
const T12 = "text-[length:calc(var(--spacing)*12)]";
const T12_5 = "text-[length:calc(var(--spacing)*12.5)]";
const T13 = "text-[length:calc(var(--spacing)*13)]";
const R4 = "rounded-[calc(var(--spacing)*4)]";
const R14 = "rounded-[calc(var(--spacing)*14)]";
const R16 = "rounded-[calc(var(--spacing)*16)]";

const CARD = cn(
  "absolute bg-white p-14 shadow-[0_1px_2px_rgb(0_0_0/0.06),0_14px_36px_-10px_rgb(0_0_0/0.22)] ring-1 ring-black/[0.06]",
  R16,
  styles.drop,
);

function EngineHeader({ engine }: { engine: BrandId }) {
  return (
    <span className="flex items-center gap-6">
      <BrandLogo id={engine} size={16} alt="" className="size-16" />
      <span className={cn(T13, "leading-none font-medium")}>{BRANDS[engine].name}</span>
    </span>
  );
}

function SkeletonLines({ widths }: { widths: readonly string[] }) {
  return (
    <span className="mt-12 flex flex-col gap-7">
      {widths.map((width) => (
        <span key={width} className={cn("h-6 rounded-full bg-sand", width)} />
      ))}
    </span>
  );
}

function MentionChip({ part }: { part: Mention }) {
  return (
    <span
      className={cn(
        "px-3 py-0.5 font-medium whitespace-nowrap",
        R4,
        part.you ? "bg-periwinkle text-royal-dark" : "bg-sand text-ink",
      )}
    >
      {part.mention}
      <span
        className={cn(
          T8,
          "ml-3 inline-grid size-12 -translate-y-1 place-items-center rounded-full leading-none font-semibold text-white",
          part.you ? "bg-royal" : "bg-ink",
        )}
      >
        {part.rank}
      </span>
    </span>
  );
}

/**
 * Three tilted AI-answer cards (Gemini at the back, Perplexity, then a ChatGPT answer in front) with a doodle sticker.
 * They drop in with 7shifts' polaroid spring, staggered back to front, once half the stack is on screen.
 */
export function AnswerStack({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const { front, middle, back } = COPY;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // framer-motion `whileInView` with amount 0.5 and once on 7shifts: the stack reveals when half of it is visible.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.49) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-inview={inView ? "" : undefined}
      className={cn(styles.stack, "relative aspect-square w-96 max-w-full [container-type:inline-size]", className)}
    >
      <p className="sr-only">{COPY.summary}</p>

      <div aria-hidden className="absolute inset-0 font-sans text-ink select-none [--spacing:calc(100cqw/384)]">
        {/* Back: Gemini, only its header peeks out on the left. */}
        <div className={cn(CARD, "top-62 left-14 h-160 w-236 -rotate-8 bg-offwhite [--drop-delay:0ms]")}>
          <EngineHeader engine={back.engine} />
          <SkeletonLines widths={["w-[86%]", "w-[64%]", "w-[74%]"]} />
        </div>

        {/* Middle: Perplexity, its header and flag peek out on the right. */}
        <div className={cn(CARD, "top-34 left-126 h-168 w-244 rotate-6 [--drop-delay:200ms]")}>
          <span className="flex items-center justify-between">
            <EngineHeader engine={middle.engine} />
            <span className={cn(T10, "rounded-full bg-[#fff0f1] px-7 py-3 leading-none font-medium text-[#b3263a]")}>
              {middle.flag}
            </span>
          </span>
          <span className={cn(T11, "mt-12 block truncate leading-[1.4] text-ink/70")}>{middle.line}</span>
          <SkeletonLines widths={["w-[78%]", "w-[58%]"]} />
        </div>

        {/* Front: the ChatGPT answer. */}
        <div className={cn(CARD, "top-112 left-40 w-300 -rotate-3 p-16 [--drop-delay:400ms]")}>
          <EngineHeader engine={front.engine} />
          <p
            className={cn(
              T12,
              "mt-12 ml-auto w-fit max-w-212 rounded-br-[calc(var(--spacing)*4)] bg-sand px-11 py-7 leading-[1.35]",
              R14,
            )}
          >
            {front.question}
          </p>
          <p className={cn(T12_5, "mt-12 leading-[1.6] text-ink/80")}>
            {front.answer.map((part, i) =>
              typeof part === "string" ? <span key={i}>{part}</span> : <MentionChip key={i} part={part} />,
            )}
          </p>
          <span className="mt-12 flex items-center gap-8">
            <span className={cn(T11, "flex h-22 items-center gap-4 rounded-full bg-sand px-8 leading-none font-medium")}>
              <Link2 className="size-12" strokeWidth={2.25} />
              {front.sources}
            </span>
            <span className="flex">
              {["bg-periwinkle-dark", "bg-violet", "bg-mint-dark", "bg-flame-light"].map((tint) => (
                <span key={tint} className={cn("-ml-5 size-16 rounded-full ring-2 ring-white first:ml-0", tint)} />
              ))}
            </span>
          </span>
        </div>

        {/* Sticker straddling the front card's bottom-right corner. */}
        <div className={cn(styles.drop, "absolute top-240 left-284 size-110 [--drop-delay:600ms]")}>
          <div className="absolute top-[17.13%] left-[19.02%] aspect-square w-[63.67%]">
            <svg viewBox="0 0 240 240" className="absolute inset-0 size-full">
              <path d={STICKER_FILL} fill="#fff" />
            </svg>
            <Image src={STICKER} alt="" fill sizes="70px" className="object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
