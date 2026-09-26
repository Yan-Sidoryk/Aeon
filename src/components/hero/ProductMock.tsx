import type { CSSProperties, ReactNode } from "react";
import { Check, ChevronDown, CircleCheck, Share2, TriangleAlert } from "lucide-react";
import { AeonLogo } from "@/components/AeonLogo";
import { BrandLogo } from "@/components/brand-logos";
import { HERO_CONTENT, type Audience, type MockCell, type Quote } from "@/components/hero/hero.content";
import s from "@/components/hero/Hero.module.css";
import { cn } from "@/lib/utils";

// Product-led hero visual: Aeon's first scan filling the prompt × engine grid, then turning into the report.
// Server component, CSS-only motion (Hero.module.css): one ~6.7 s run from first paint, then the finished frame.
// Two compositions share the 20px-radius frame (a size container):
//   ≥ 720px frame — a 1120 × 630 design stage; --spacing = 100cqw / 1120, so every spacing utility is one design px
//                   and the whole app window scales with the frame like a screenshot (1:1 at 1440).
//   < 720px frame — a simplified single-column window (3–5 engines, 4 prompts, report headline) in real px,
//                   scaled down only below a 350px frame (320px viewports).
// Each stage also sets a scaled base font-size so inherited line boxes shrink with it.
// The inactive composition is taken out of flow and made invisible rather than display:none, because a display
// toggle (e.g. a resize across 720px, or a browser re-layout for a full-size screenshot) restarts CSS animations.

const M = HERO_CONTENT.mock;

type CSSVars = CSSProperties & Record<`--${string}`, string | number>;

/* Timeline, in ms after first paint. */
const T = { countFrom: 300, scanStart: 500, rowStep: 680, scanEnd: 4600, done: 5000 } as const;
/** Per-row, per-engine answer latency so cells land unevenly, like a live fan-out. */
const JITTER = [
  [0, 240, 110, 330, 170],
  [0, 280, 150, 380, 220],
  [160, 0, 300, 200, 90],
  [90, 280, 0, 210, 340],
  [250, 120, 340, 0, 180],
  [190, 330, 60, 260, 0],
] as const;
const cellAt = (row: number, col: number) => T.scanStart + row * T.rowStep + (JITTER[row]?.[col] ?? 0);
/** First accuracy issue = the wrong-dose cell landing; the second one is found off-screen near the end. */
const FIRST_ISSUE = cellAt(1, 0);
const SECOND_ISSUE = 3900;

const at = (ms: number): CSSVars => ({ "--d": `${ms}ms` });
const cellVars = (row: number, col: number): CSSVars => ({ "--d": `${cellAt(row, col)}ms`, "--sd": `${(row + col) * 90}ms` });
const counter = (value: number): CSSVars => ({ "--n": value, "--d": `${T.countFrom}ms`, "--dur": `${T.scanEnd - T.countFrom}ms` });
const barFill = (value: number): CSSVars => ({ ...counter(value), width: `${value}%` });
const reportBar = (value: number): CSSVars => ({
  width: `${value}%`,
  "--d": `${T.done + 260}ms`,
  "--dur": "900ms",
  "--ease": "cubic-bezier(0.22, 1, 0.36, 1)",
});
/** 0 → 1 → 2 as the two issues are found: two equal steps whose edges fall on FIRST_ISSUE and SECOND_ISSUE. */
const issuesCounter: CSSVars = {
  "--n": M.counters.accuracy.value,
  "--ease": "steps(2, jump-end)",
  "--dur": `${2 * (SECOND_ISSUE - FIRST_ISSUE)}ms`,
  "--d": `${2 * FIRST_ISSUE - SECOND_ISSUE}ms`,
};

/* Stage type scale and radii, in design px (1 unit = var(--spacing)). */
const T9 = "text-[length:calc(var(--spacing)*9)]";
const T10 = "text-[length:calc(var(--spacing)*10)]";
const T10_5 = "text-[length:calc(var(--spacing)*10.5)]";
const T11 = "text-[length:calc(var(--spacing)*11)]";
const T11_5 = "text-[length:calc(var(--spacing)*11.5)]";
const T12 = "text-[length:calc(var(--spacing)*12)]";
const T12_5 = "text-[length:calc(var(--spacing)*12.5)]";
const T13 = "text-[length:calc(var(--spacing)*13)]";
const T16 = "text-[length:calc(var(--spacing)*16)]";
const T24 = "text-[length:calc(var(--spacing)*24)]";
const T34 = "text-[length:calc(var(--spacing)*34)]";
const R4 = "rounded-[calc(var(--spacing)*4)]";
const R6 = "rounded-[calc(var(--spacing)*6)]";
const R7 = "rounded-[calc(var(--spacing)*7)]";
const R8 = "rounded-[calc(var(--spacing)*8)]";
const R10 = "rounded-[calc(var(--spacing)*10)]";
const R12 = "rounded-[calc(var(--spacing)*12)]";
const R14 = "rounded-[calc(var(--spacing)*14)]";

const STACK = "grid *:col-start-1 *:row-start-1";
const LINE = "border-[#edece8]";
const WINDOW =
  "bg-white shadow-[0_0_0_1px_rgba(25,63,120,0.07),0_2px_4px_rgba(25,63,120,0.05),0_14px_32px_-10px_rgba(25,63,120,0.2),0_40px_80px_-32px_rgba(25,63,120,0.32)]";
const RED_TEXT = "text-[#b42318]";

const AUDIENCE_TAG: Record<Audience, string> = {
  Patient: "bg-periwinkle text-royal-dark",
  Caregiver: "bg-lavender text-eggplant",
  HCP: "bg-mint/15 text-forest",
};

/* ------------------------------------------------------------------------------------------------ atoms */

function Spinner({ className }: { className?: string }) {
  return <span className={cn("shrink-0 rounded-full border-2 border-royal/25 border-t-royal", s.spin, className)} />;
}

/** "Scanning" until the run is done, then "Scan complete". */
function StatusChip({ className }: { className: string }) {
  const chip = cn(className, "inline-flex items-center rounded-full leading-none font-medium whitespace-nowrap");
  return (
    <div className={cn(STACK, "justify-items-end")}>
      <span className={cn(chip, s.out, "bg-periwinkle/70 text-royal-dark")} style={at(T.done)}>
        <Spinner className="size-[1em]" />
        {M.scanning}
      </span>
      <span className={cn(chip, s.in, "bg-[#ecfdf3] text-[#067647]")} style={at(T.done + 120)}>
        <Check className="size-[1.1em]" strokeWidth={2.75} />
        {M.complete}
      </span>
    </div>
  );
}

/** One grid cell: a shimmering skeleton that gives way to the engine's result. */
function Cell({ cell, row, col, compact = false }: { cell: MockCell; row: number; col: number; compact?: boolean }) {
  const vars = cellVars(row, col);
  const label = M.cellLabels[cell];
  const pill = compact
    ? cn(T10, "h-20 px-7")
    : cn(T11, "h-22 px-9");
  let result: ReactNode;
  if (cell === "none") {
    result = <span className={cn(compact ? T11 : T12, s.pop, "leading-none text-taupe")} style={vars}>{label}</span>;
  } else if (cell === "wrong") {
    result = (
      <span
        className={cn(
          s.flag,
          "inline-flex items-center justify-center bg-[#fee4e2] leading-none font-semibold",
          RED_TEXT,
          compact
            ? cn(T10, R6, "max-w-50 px-6 py-3 text-center leading-[1.1] @min-[480px]:h-20 @min-[480px]:max-w-none @min-[480px]:rounded-full @min-[480px]:px-7 @min-[480px]:py-0 @min-[480px]:whitespace-nowrap")
            : cn(pill, "rounded-full whitespace-nowrap"),
        )}
        style={vars}
      >
        {label}
      </span>
    );
  } else {
    result = (
      <span
        className={cn(
          s.pop,
          pill,
          "inline-flex items-center rounded-full leading-none font-semibold whitespace-nowrap",
          cell === "you" ? "bg-royal/12 text-royal-dark" : "bg-stone/10 text-graphite",
        )}
        style={vars}
      >
        {label}
      </span>
    );
  }
  return (
    <div className={cn(STACK, "place-items-center")}>
      <span className={cn(s.skel, s.out, "rounded-full bg-[#efeee9]", compact ? "h-16 w-38" : "h-18 w-50")} style={vars} />
      {result}
    </div>
  );
}

function Highlighted({ quote, className }: { quote: Quote; className: string }) {
  return (
    <>
      {quote.before}
      <span className={cn("rounded-[3px] px-[0.2em]", className)}>{quote.highlight}</span>
      {quote.after}
    </>
  );
}

/* ------------------------------------------------------------------------------------------------ desktop */

function TopBar() {
  return (
    <div className={cn("absolute inset-x-0 top-0 flex h-52 items-center border-b px-18", LINE)}>
      <AeonLogo variant="mark" title="" className="w-22 shrink-0 text-black" />
      <span className="mx-14 h-20 w-px bg-[#e6e4df]" />
      <div className="flex items-center gap-8">
        <span className={cn(T11, R6, "grid size-22 place-items-center bg-lavender font-display font-semibold text-eggplant")}>
          {M.brandInitial}
        </span>
        <p className={cn(T13, "leading-none whitespace-nowrap")}>
          <span className="font-semibold">{M.brand}</span>
          <span className="text-stone"> · {M.indication}</span>
        </p>
        <ChevronDown className="size-14 text-stone" />
      </div>
      <div className="ml-24 flex items-center gap-2">
        {M.tabs.map((tab, i) => (
          <span
            key={tab}
            className={cn(
              T12_5,
              R7,
              "flex items-center gap-6 px-11 py-7 leading-none font-medium",
              i === 0 ? "bg-sand text-black" : "text-stone",
            )}
          >
            {tab}
            {i === 2 && (
              <span className={cn(T10, s.pop, "grid h-16 min-w-16 place-items-center rounded-full bg-[#d92d20] px-4 font-semibold text-white")} style={at(T.done + 250)}>
                {M.counters.accuracy.value}
              </span>
            )}
            {i === 3 && (
              <span className={cn(T10, s.pop, "grid h-16 min-w-16 place-items-center rounded-full bg-royal/12 px-4 font-semibold text-royal-dark")} style={at(T.done + 350)}>
                {M.report.fixes.length}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-10">
        <StatusChip className={cn(T11_5, "h-26 gap-6 px-10")} />
        <span className={cn(T12, R8, "flex h-28 items-center gap-6 border border-[#e6e4df] px-10 leading-none font-medium")}>
          <Share2 className="size-12" />
          {M.share}
        </span>
      </div>
    </div>
  );
}

function Tile({ label, value, footer, className }: { label: string; value: ReactNode; footer: ReactNode; className?: string }) {
  return (
    <div className={cn(R10, "relative border border-[#eceae5] px-14 pt-12 pb-12", className)}>
      <p className={cn(T11_5, "relative leading-none text-stone")}>{label}</p>
      <div className={cn(T24, "relative mt-9 flex items-baseline font-display leading-none font-semibold tracking-[-0.02em] tabular-nums")}>
        {value}
      </div>
      <div className="relative mt-11 flex h-8 items-center">{footer}</div>
    </div>
  );
}

function Track({ children }: { children: ReactNode }) {
  return <div className="h-4 w-full overflow-hidden rounded-full bg-sand">{children}</div>;
}

function Counters() {
  const { answers, you, competitor, accuracy } = M.counters;
  return (
    <div className="mt-16 grid grid-cols-4 gap-10">
      <Tile
        label={answers.label}
        value={
          <>
            <span className={s.count} style={counter(answers.value)} />
            <span className={cn(T13, "ml-2 font-sans font-medium tracking-normal text-stone")}>/{answers.value}</span>
          </>
        }
        footer={
          <Track>
            <div className={cn(s.bar, "h-full w-full rounded-full bg-royal")} style={counter(answers.value)} />
          </Track>
        }
      />
      <Tile
        label={you.label}
        value={<span className={cn(s.count, s.pct, "text-royal")} style={counter(you.value)} />}
        footer={
          <Track>
            <div className={cn(s.bar, "h-full rounded-full bg-royal")} style={barFill(you.value)} />
          </Track>
        }
      />
      <Tile
        label={competitor.label}
        value={<span className={cn(s.count, s.pct)} style={counter(competitor.value)} />}
        footer={
          <Track>
            <div className={cn(s.bar, "h-full rounded-full bg-taupe")} style={barFill(competitor.value)} />
          </Track>
        }
      />
      {/* Lights up red when the first wrong answer lands. */}
      <Tile
        label={accuracy.label}
        className="overflow-hidden"
        value={
          <span className={STACK}>
            <span className={s.out} style={at(FIRST_ISSUE)}>
              <span className={s.count} style={issuesCounter} />
            </span>
            <span className={cn(s.in, "text-[#d92d20]")} style={at(FIRST_ISSUE)}>
              <span className={s.count} style={issuesCounter} />
            </span>
          </span>
        }
        footer={<span className={cn(T10_5, "leading-none whitespace-nowrap text-stone")}>{accuracy.note}</span>}
      />
    </div>
  );
}

const DESKTOP_GRID = "grid grid-cols-[1fr_repeat(5,calc(var(--spacing)*84))] items-center";

function ScanGrid() {
  return (
    <div className="mt-18">
      <div className={cn(DESKTOP_GRID, "h-32 border-b", LINE)}>
        <span className={cn(T11, "font-medium text-stone")}>{M.promptHeader}</span>
        {M.engines.map((engine) => (
          <span key={engine.id} className="flex items-center justify-center gap-5">
            <BrandLogo id={engine.id} size={14} alt="" className="size-14" />
            <span className={cn(T11, "leading-none font-medium whitespace-nowrap text-black/75")}>{engine.name}</span>
          </span>
        ))}
      </div>
      {M.rows.map((row, r) => (
        <div key={row.prompt} className={cn(DESKTOP_GRID, "h-50 border-b border-[#f3f2ef] last:border-b-0")}>
          <div className="min-w-0 pr-12">
            <p className={cn(T13, "truncate leading-[1.25] font-medium")}>{row.prompt}</p>
            <span className={cn(T10, R4, "mt-5 flex w-fit px-5 py-2.5 leading-none font-medium", AUDIENCE_TAG[row.audience])}>
              {row.audience}
            </span>
          </div>
          {row.cells.map((cell, c) => (
            <Cell key={M.engines[c]?.id ?? c} cell={cell} row={r} col={c} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ReportRail() {
  const R = M.report;
  const skel = cn(s.skel, "bg-[#ecebe6]");
  return (
    <div className={cn("absolute top-52 right-0 bottom-0 w-300 border-l bg-offwhite px-20 pt-20", LINE)}>
      <p className={cn(T11, "leading-none font-semibold tracking-[0.06em] text-stone uppercase")}>{R.eyebrow}</p>
      <div className={cn(STACK, "mt-14 items-start")}>
        {/* While scanning: the report builds as answers arrive. */}
        <div className={s.out} style={at(T.done)}>
          <p className={cn(T12, "flex items-center gap-7 leading-none text-stone")}>
            <Spinner className="size-11" />
            {R.building}
          </p>
          <div className="mt-16 grid grid-cols-2 gap-10">
            <span className={cn(skel, R6, "h-44")} />
            <span className={cn(skel, R6, "h-44")} />
          </div>
          <span className={cn(skel, "mt-12 block h-6 rounded-full")} />
          <span className={cn(skel, "mt-6 block h-6 w-3/4 rounded-full")} />
          <span className={cn(skel, R10, "mt-20 block h-150")} />
          <span className={cn(skel, R6, "mt-18 block h-24")} />
          <span className={cn(skel, R6, "mt-8 block h-24")} />
        </div>

        {/* Done: the report. */}
        <div>
          <div className={cn(s.rise, "grid grid-cols-2 gap-10")} style={at(T.done + 100)}>
            {[R.you, R.competitor].map((score, i) => (
              <div key={score.label}>
                <p className={cn(T11_5, "leading-none text-stone")}>{score.label}</p>
                <p
                  className={cn(
                    T34,
                    "mt-7 font-display leading-none font-semibold tracking-[-0.03em] tabular-nums",
                    i === 0 ? "text-royal" : "text-black",
                  )}
                >
                  {score.value}
                </p>
              </div>
            ))}
          </div>
          <div className={s.rise} style={at(T.done + 220)}>
            <div className="mt-12 space-y-5">
              {[
                { value: R.you.value, fill: "bg-royal" },
                { value: R.competitor.value, fill: "bg-taupe" },
              ].map((bar) => (
                <div key={bar.fill} className="h-6 overflow-hidden rounded-full bg-[#eceae5]">
                  <div className={cn(s.bar, "h-full rounded-full", bar.fill)} style={reportBar(bar.value)} />
                </div>
              ))}
            </div>
            <p className={cn(T12, "mt-10 leading-[1.35] text-stone")}>{R.takeaway}</p>
          </div>

          <div className={cn(s.rise, R10, "mt-16 border border-[#fecdca] bg-[#fef3f2] p-12")} style={at(T.done + 420)}>
            <p className={cn(T12_5, "flex items-center gap-6 leading-[1.2] font-semibold", RED_TEXT)}>
              <TriangleAlert className="size-14 shrink-0" />
              {R.accuracy.title}
            </p>
            <div className={cn(R7, "mt-10 border border-[#fee4e2] bg-white px-10 py-8")}>
              <p className={cn(T10_5, "flex items-center gap-5 leading-none text-stone")}>
                <BrandLogo id="chatgpt" size={12} alt="" className="size-12" />
                {R.accuracy.aiSource}
              </p>
              <p className={cn(T12, "mt-6 leading-[1.4]")}>
                <Highlighted quote={R.accuracy.aiQuote} className={cn("bg-[#fee4e2]", RED_TEXT)} />
              </p>
            </div>
            <div className={cn(R7, "mt-6 border border-[#eceae5] bg-white px-10 py-8")}>
              <p className={cn(T10_5, "flex items-center gap-5 leading-none text-stone")}>
                <CircleCheck className="size-12 text-[#079455]" />
                {R.accuracy.labelSource}
              </p>
              <p className={cn(T12, "mt-6 leading-[1.4]")}>
                <Highlighted quote={R.accuracy.labelQuote} className="bg-[#dcfae6] text-[#067647]" />
              </p>
            </div>
          </div>

          <p className={cn(T12_5, s.rise, "mt-16 leading-none font-semibold")} style={at(T.done + 620)}>
            {R.fixesTitle}
          </p>
          <ol className="mt-6">
            {R.fixes.map((fix, i) => (
              <li
                key={fix}
                className={cn(s.rise, "flex items-center gap-8 border-t py-7 first:border-t-0", LINE)}
                style={at(T.done + 700 + i * 110)}
              >
                <span className={cn(T10, "grid size-18 shrink-0 place-items-center rounded-full bg-periwinkle font-semibold text-royal-dark")}>
                  {i + 1}
                </span>
                <span className={cn(T12, "min-w-0 flex-1 truncate leading-[1.25] font-medium")}>{fix}</span>
                <span
                  className={cn(
                    T10_5,
                    "inline-flex h-22 shrink-0 items-center rounded-full px-9 leading-none font-semibold whitespace-nowrap",
                    i === 0 ? "bg-royal text-white" : "bg-royal/10 text-royal-dark",
                  )}
                >
                  {R.fixCta}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function DesktopPreview() {
  return (
    <div
      aria-hidden="true"
      className="invisible absolute inset-x-0 top-0 aspect-[1120/630] w-full text-[length:calc(var(--spacing)*13)] leading-[1.3] @min-[720px]:visible @min-[720px]:relative [--spacing:calc(100cqw/1120)]"
    >
      <div className={cn("absolute top-52 right-56 -bottom-24 left-56 overflow-hidden", R14, WINDOW)}>
        <TopBar />
        <div className="absolute top-52 bottom-0 left-0 w-708 px-24 pt-22">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-10">
              <p className={cn(T16, "font-display leading-none font-semibold tracking-[-0.02em]")}>{M.title}</p>
              <p className={cn(T12, "leading-none text-stone")}>{M.meta}</p>
            </div>
            <div className={cn(R8, "flex gap-2 bg-sand p-3")}>
              {M.audiences.map((audience, i) => (
                <span
                  key={audience}
                  className={cn(
                    T11,
                    R6,
                    "px-9 py-5 leading-none font-medium",
                    i === 0 ? "bg-white text-black shadow-[0_1px_2px_rgba(20,21,21,0.1)]" : "text-stone",
                  )}
                >
                  {audience}
                </span>
              ))}
            </div>
          </div>
          <Counters />
          <ScanGrid />
        </div>
        <ReportRail />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ mobile */

// Engines 4 and 5 join the grid as the frame widens. Their tracks are 0px and their cells invisible until then
// (never display:none: toggling display would restart the CSS timeline mid-run).
const MOBILE_GRID =
  "grid grid-cols-[1fr_repeat(3,calc(var(--spacing)*58))_0px_0px] @min-[480px]:grid-cols-[1fr_repeat(4,calc(var(--spacing)*66))_0px] @min-[600px]:grid-cols-[1fr_repeat(5,calc(var(--spacing)*72))]";
// Only ever hide (never force `visible`): the whole composition inherits `invisible` when the desktop one is active.
const MOBILE_COL_VIS = ["", "", "", "@max-[480px]:invisible", "@max-[600px]:invisible"] as const;
const MOBILE_ROWS = 4;

function MobilePreview() {
  const R = M.report;
  return (
    <div
      aria-hidden="true"
      className="px-14 pt-16 text-[length:calc(var(--spacing)*12)] leading-[1.3] @min-[720px]:invisible @min-[720px]:absolute @min-[720px]:inset-x-0 @min-[720px]:top-0 [--spacing:min(1px,calc(100cqw/350))]"
    >
      <div className={cn(R12, WINDOW, "-mb-14 overflow-hidden")}>
        <div className={cn("flex h-40 items-center gap-7 border-b px-12", LINE)}>
          <AeonLogo variant="mark" title="" className="w-17 shrink-0 text-black" />
          <span className="h-14 w-px shrink-0 bg-[#e6e4df]" />
          <span className={cn(T10, R4, "grid size-17 shrink-0 place-items-center bg-lavender font-display font-semibold text-eggplant")}>
            {M.brandInitial}
          </span>
          <p className={cn(T12, "min-w-0 truncate leading-[1.2]")}>
            <span className="font-semibold">{M.brand}</span>
            <span className="text-stone"> · {M.indication}</span>
          </p>
          <div className="ml-auto shrink-0">
            <StatusChip className={cn(T10, "h-22 gap-5 px-8")} />
          </div>
        </div>

        <div className="px-12 pt-12 pb-20">
          <div className="grid grid-cols-2 gap-8">
            {[
              { ...R.you, tone: "text-royal", fill: "bg-royal" },
              { ...R.competitor, tone: "text-black", fill: "bg-taupe" },
            ].map((score) => (
              <div key={score.label} className={cn(R10, "border border-[#eceae5] px-10 pt-9 pb-10")}>
                <p className={cn(T10_5, "leading-none text-stone")}>{score.label}</p>
                <p className={cn(T24, "mt-6 font-display leading-none font-semibold tracking-[-0.02em] tabular-nums", score.tone)}>
                  <span className={s.count} style={counter(score.value)} />
                </p>
                <div className="mt-8 h-4 overflow-hidden rounded-full bg-sand">
                  <div className={cn(s.bar, "h-full rounded-full", score.fill)} style={barFill(score.value)} />
                </div>
              </div>
            ))}
          </div>

          {/* Reading answers while the grid fills, then the accuracy alert. */}
          <div className={cn(STACK, "mt-8")}>
            <div className={cn(s.out, R8, "relative flex h-34 items-center gap-7 overflow-hidden border bg-offwhite px-10", LINE)} style={at(T.done)}>
              <Spinner className="size-10" />
              <span className={cn(T10_5, "leading-none text-stone")}>{M.reading}</span>
              <span className={cn(T11, "ml-auto leading-none font-semibold tabular-nums")}>
                <span className={s.count} style={counter(M.counters.answers.value)} />/{M.counters.answers.value}
              </span>
              <span className="absolute inset-x-0 bottom-0 h-2 bg-sand">
                <span className={cn(s.bar, "block h-full w-full bg-royal")} style={counter(M.counters.answers.value)} />
              </span>
            </div>
            <p
              className={cn(s.rise, R8, T11, RED_TEXT, "flex h-34 items-center gap-6 border border-[#fecdca] bg-[#fef3f2] px-10 leading-none font-semibold")}
              style={at(T.done + 120)}
            >
              <TriangleAlert className="size-13 shrink-0" />
              {R.accuracy.title}
            </p>
          </div>

          <div className="mt-10">
            <div className={cn(MOBILE_GRID, "items-end border-b pb-7", LINE)}>
              <span className={cn(T10, "leading-none font-medium text-stone")}>{M.promptHeader}</span>
              {M.engines.map((engine, c) => (
                <span key={engine.id} className={cn("flex min-w-0 flex-col items-center gap-4", MOBILE_COL_VIS[c])}>
                  <BrandLogo id={engine.id} size={14} alt="" className="size-14" />
                  <span className={cn(T9, "leading-none font-medium whitespace-nowrap text-black/70")}>{engine.name}</span>
                </span>
              ))}
            </div>
            {M.rows.slice(0, MOBILE_ROWS).map((row, r) => (
              <div key={row.prompt} className={cn(MOBILE_GRID, "min-h-46 items-center border-b border-[#f3f2ef] py-6 last:border-b-0")}>
                <p className={cn(T11_5, "pr-6 leading-[1.3] font-medium")}>{row.prompt}</p>
                {row.cells.map((cell, c) => (
                  <div key={M.engines[c]?.id ?? c} className={cn("grid min-w-0", MOBILE_COL_VIS[c])}>
                    <Cell cell={cell} row={r} col={c} compact />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------ frame */

/** 7shifts' media frame (1120 × 630 at 1440, radius 20) holding the product instead of a video. */
export function ProductMock() {
  return (
    <div
      className={cn(
        "@container relative isolate overflow-hidden rounded-[20px] bg-[linear-gradient(155deg,#d6e0ff_0%,#dcdcff_52%,#e9dcff_100%)] select-none",
        s.motion,
      )}
    >
      <p className="sr-only">{M.description}</p>
      <DesktopPreview />
      <MobilePreview />
    </div>
  );
}
