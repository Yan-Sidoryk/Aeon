import { MessageCircleQuestionMark } from "lucide-react";
import { cn } from "@/lib/utils";
import { MockFrame } from "./MockFrame";
import s from "./mocks.module.css";
import { Cursor, DrawnCheck, R12_5, R20, R4_75, T10_45, T13_3, T17_5, T8_5, T9_3 } from "./parts";

// 7shifts "Hire" anatomy: success pop-up above a table card that bleeds off the bottom, periwinkle panel, cursor.
type Cell = "you" | "comp" | "none";

const ENGINES = ["ChatGPT", "Claude", "Gemini", "Perplexity"] as const;

const ROWS: readonly { prompt: string; cells: readonly [Cell, Cell, Cell, Cell] }[] = [
  { prompt: "Best treatment for moderate eczema?", cells: ["comp", "comp", "you", "comp"] },
  { prompt: "Is [brand] safe long-term?", cells: ["you", "you", "none", "you"] },
  { prompt: "[Brand] vs Competitor X", cells: ["comp", "you", "comp", "comp"] },
  { prompt: "How is [brand] dosed?", cells: ["you", "none", "you", "comp"] },
];

const ROW_DELAYS = ["[--mock-d:100ms]", "[--mock-d:160ms]", "[--mock-d:220ms]", "[--mock-d:280ms]"] as const;

// Prompt column + four 56.5-unit engine columns, as 7shifts' Location / Position / Open grid.
const GRID = "grid grid-cols-[1fr_repeat(4,calc(var(--spacing)*56.5))] items-center pr-14.25";

function EnginePill({ cell }: { cell: Cell }) {
  if (cell === "none") {
    return <span className={cn(T10_45, "justify-self-center leading-none text-taupe")}>—</span>;
  }
  return (
    <span
      className={cn(
        T8_5,
        "flex h-17 items-center justify-self-center rounded-full px-6.5 leading-none font-medium whitespace-nowrap",
        cell === "you" ? "bg-royal/15 text-royal-dark" : "bg-stone/12 text-graphite"
      )}
    >
      {cell === "you" ? "You" : "Comp. X"}
    </span>
  );
}

function SovBar({ label, value, fill, delay }: { label: string; value: number; fill: string; delay: string }) {
  return (
    <div className="flex items-center gap-6">
      <span className={cn(T8_5, "w-50 leading-none whitespace-nowrap")}>{label}</span>
      <span className="relative h-5 w-60 overflow-hidden rounded-full bg-sand">
        <span
          className={cn("absolute inset-y-0 left-0 origin-left rounded-full", fill, s.fillX, delay)}
          style={{ width: `${value}%` }}
        />
      </span>
      <span className={cn(T9_3, "w-14 text-right leading-none font-medium")}>{value}</span>
    </div>
  );
}

export function TrackMock() {
  return (
    <MockFrame kind="track" className="bg-periwinkle">
      {/* Table card: 457 wide at (31.5, 223.25), r 20, cut by the panel edge. */}
      <div className={cn("absolute top-223.25 left-31.5 h-400 w-457 bg-white", R20, s.slideDown)}>
        <p className={cn(T13_3, "absolute top-33 left-26 leading-[1.2] font-medium")}>Who AI recommends</p>

        {/* Share-of-voice pair in the slot of 7shifts' navy "Create job opening" button. */}
        <div className="absolute top-27.25 right-25.75 flex h-27.5 items-center gap-12">
          <span className={cn(T9_3, "leading-none whitespace-nowrap text-black/75")}>Share of voice</span>
          <div className="flex flex-col gap-5.5">
            <SovBar label="You" value={34} fill="bg-royal" delay="[--mock-d:900ms]" />
            <SovBar label="Competitor X" value={71} fill="bg-taupe" delay="[--mock-d:1000ms]" />
          </div>
        </div>

        <div className="absolute top-73.75 left-25.75 w-405.5">
          <div className={cn(T9_3, GRID, "h-28.5 pl-15 leading-none text-black/75")}>
            <span>Prompt</span>
            {ENGINES.map((engine) => (
              <span key={engine} className="text-center">
                {engine}
              </span>
            ))}
          </div>
          <div className="mt-4.75 flex flex-col gap-4.75">
            {ROWS.map((row, i) => (
              <div
                key={row.prompt}
                className={cn(GRID, "h-45.25 bg-offwhite pl-17 [--mock-rise:8]", R4_75, s.fadeUp, ROW_DELAYS[i])}
              >
                <div className="flex items-center gap-7.75 pr-8">
                  <MessageCircleQuestionMark className="size-13 shrink-0 text-[#4e72f6]" />
                  <span className={cn(T10_45, "leading-[1.2] font-medium")}>{row.prompt}</span>
                </div>
                {row.cells.map((cell, j) => (
                  <EnginePill key={ENGINES[j]} cell={cell} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Success pop-up: 270.5 x 143.5 at (124.75, 41.25), r 12.5; scales 0 → 105% → 100% as the table settles. */}
      <div
        className={cn(
          "absolute top-41.25 left-124.75 flex h-143.5 w-270.5 flex-col items-center bg-white [--mock-d:750ms]",
          R12_5,
          s.pop
        )}
      >
        <span className="mt-19 grid size-43.75 place-items-center rounded-full bg-lime">
          <DrawnCheck className="h-14 w-19.5 translate-x-0.5 translate-y-0.5" drawClassName="[--mock-d:1100ms]" />
        </span>
        <p className={cn(T17_5, "mt-12.5 text-center leading-[1.245] font-medium")}>
          Scan complete
          <br />
          40 prompts × 5 engines
        </p>
      </div>

      <Cursor className={cn("top-371 left-291.5 [--mock-d:1500ms] [--mock-loop-d:1800ms]", s.cursorTrack)} />
    </MockFrame>
  );
}
