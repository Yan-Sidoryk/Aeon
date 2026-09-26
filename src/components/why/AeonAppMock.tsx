import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Calendar,
  ChartNoAxesColumn,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FilePenLine,
  Gauge,
  Library,
  Link as LinkIcon,
  MessageSquareText,
  Pill,
  Plug,
  ShieldCheck,
  Swords,
  TriangleAlert,
} from "lucide-react";
import { AeonLogo } from "@/components/AeonLogo";
import { cn } from "@/lib/utils";
import styles from "./why.module.css";

// HTML rebuild of 7shifts' "With 7shifts" product-tour Lottie (1080×1080 comp) for Aeon.
// All geometry is in the Lottie's 1080-unit grid: --u = frame width / 1080 (parent is the @container).
// The window bleeds past the rounded blue panel and is clipped only by the square frame, like the Lottie.
// Motion (why.module.css): pointer clicks "Overview", bars grow, rows fade in, pointer hovers "Prompts", loop.

// `pill`: "active" = the screen on show, "hover" = the row the pointer visits (pill shown by the loop).
type NavItem = { label: string; icon: LucideIcon; dot?: boolean; pill?: "active" | "hover" };
type Bar = { label: string; base: number; top: number };
type EngineRow = { initial: string; name: string; share: string; accuracy: string; tint: string };

type MockCopy = {
  ariaLabel: string;
  brand: string;
  view: string;
  rangeFrom: string;
  rangeTo: string;
  today: string;
  columns: readonly [string, string, string];
};

const MOCK: MockCopy = {
  ariaLabel:
    "Aeon dashboard for Brand A in atopic dermatitis: share of voice in AI answers rising week over week, with share and label accuracy by engine.",
  brand: "Brand A · Atopic dermatitis",
  view: "Share of voice",
  rangeFrom: "Jun 2",
  rangeTo: "Jul 28",
  today: "Today",
  columns: ["Engine", "Share of voice", "Accuracy"],
};

// Same 4-2-3-2 grouping as the 7shifts sidebar. Illustrative UI only.
const NAV: readonly (readonly NavItem[])[] = [
  [
    { label: "Overview", icon: Gauge, pill: "active" },
    { label: "Prompts", icon: MessageSquareText, pill: "hover" },
    { label: "Competitors", icon: Swords },
    { label: "Citations", icon: LinkIcon },
  ],
  [
    { label: "Accuracy", icon: ShieldCheck },
    { label: "Safety signals", icon: TriangleAlert, dot: true },
  ],
  [
    { label: "Drafts", icon: FilePenLine },
    { label: "Reviews", icon: ClipboardCheck, dot: true },
    { label: "Claims library", icon: Library },
  ],
  [
    { label: "Reports", icon: ChartNoAxesColumn },
    { label: "Integrations", icon: Plug, dot: true },
  ],
];

// Weekly share-of-voice bars in Lottie units (royal body + lighter top segment). Illustrative UI numbers.
const BARS: readonly Bar[] = [
  { label: "6/2", base: 70, top: 0 },
  { label: "6/9", base: 82, top: 0 },
  { label: "6/16", base: 78, top: 0 },
  { label: "6/23", base: 92, top: 20 },
  { label: "6/30", base: 100, top: 28 },
  { label: "7/7", base: 112, top: 36 },
  { label: "7/14", base: 126, top: 44 },
  { label: "7/21", base: 138, top: 52 },
];

const ROWS: readonly EngineRow[] = [
  { initial: "C", name: "ChatGPT", share: "27%", accuracy: "96%", tint: "bg-lavender" },
  { initial: "G", name: "Gemini", share: "23%", accuracy: "92%", tint: "bg-periwinkle" },
  { initial: "P", name: "Perplexity", share: "19%", accuracy: "94%", tint: "bg-lime" },
];

// Row slots from the Lottie (82u rows at an 86u pitch), each with its staggered fade-in.
const ROW_SLOTS = [
  { top: "top-[calc(var(--u)*658.5)]", fade: styles.row1 },
  { top: "top-[calc(var(--u)*744.5)]", fade: styles.row2 },
  { top: "top-[calc(var(--u)*830.5)]", fade: styles.row3 },
];

// Chart geometry in 1080-unit comp coordinates (from the Lottie's "Tips Overview" screen).
const GRID_Y = [460.9, 496.9, 532.8, 568.8, 604.7, 640.7];
const BASE_Y = 670.9;
const Y_LABELS = [
  { text: "30%", y: 459.1 },
  { text: "20%", y: 525.5 },
  { text: "10%", y: 591.8 },
  { text: "0%", y: 656 },
];
const BAR_X0 = 645.6;
const BAR_PITCH = 55;
const BAR_W = 40;

// Single-line labels trimmed to cap height / baseline so `top` = the Lottie's cap-top coordinate.
const TRIM = "[text-box:trim-both_cap_alphabetic]";

export function AeonAppMock() {
  return (
    <div
      role="img"
      aria-label={MOCK.ariaLabel}
      className="relative aspect-square w-full overflow-hidden font-sans [--u:calc(100cqw/1080)]"
    >
      {/* Royal-blue panel */}
      <div className="absolute inset-0 rounded-[calc(var(--u)*41.8)] bg-royal" />

      {/* App window: x 153, y 144 in the comp; bleeds off the right and bottom edges */}
      <div className="absolute top-[calc(var(--u)*144)] left-[calc(var(--u)*153)] h-[calc(var(--u)*936)] w-[calc(var(--u)*1000)] overflow-hidden rounded-tl-[calc(var(--u)*18)] bg-white text-black">
        <Sidebar />
        <MainPane />
      </div>

      <Chart />
      <HandPointer />
    </div>
  );
}

function Sidebar() {
  return (
    <div className="absolute inset-y-0 left-0 w-[calc(var(--u)*338)] border-r-[length:calc(var(--u)*1.4)] border-[#d5d5d5] text-[#323232]">
      <div className="relative h-[calc(var(--u)*99)]">
        <AeonLogo
          variant="mark"
          title="Aeon"
          className="absolute top-[calc(var(--u)*31)] left-[calc(var(--u)*20)] w-[calc(var(--u)*40)] text-black"
        />
        <ChevronLeft
          className="absolute top-[calc(var(--u)*37)] left-[calc(var(--u)*276)] size-[calc(var(--u)*25)] text-[#767676]"
          strokeWidth={1.6}
        />
      </div>
      {NAV.map((group, g) => (
        <div
          key={group[0].label}
          className={cn(
            "pb-[calc(var(--u)*19.4)]",
            g === 0
              ? "pt-[calc(var(--u)*14.9)]"
              : "border-t-[length:calc(var(--u)*1.4)] border-[#d5d5d5] pt-[calc(var(--u)*18.5)]",
          )}
        >
          {group.map((item) => (
            <NavRow key={item.label} item={item} />
          ))}
        </div>
      ))}
    </div>
  );
}

function NavRow({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <div className="relative flex h-[calc(var(--u)*62.3)] items-center pl-[calc(var(--u)*37)]">
      {item.pill && (
        <span
          className={cn(
            "absolute top-1/2 left-[calc(var(--u)*22.6)] h-[calc(var(--u)*56.6)] w-[calc(var(--u)*292.8)] -translate-y-1/2 rounded-[calc(var(--u)*22.6)] bg-[#d6e0ff]",
            item.pill === "hover" && styles.hover,
          )}
        />
      )}
      <span className="relative size-[calc(var(--u)*28)] shrink-0">
        <Icon className="size-full" strokeWidth={1.7} />
        {item.dot && (
          <span className="absolute -top-[calc(var(--u)*1.5)] -right-[calc(var(--u)*0.8)] size-[calc(var(--u)*11.3)] rounded-full border-[length:calc(var(--u)*1.4)] border-white bg-flame" />
        )}
      </span>
      <span className={cn("relative ml-[calc(var(--u)*23)] text-[length:calc(var(--u)*22)] font-medium", TRIM)}>
        {item.label}
      </span>
    </div>
  );
}

function MainPane() {
  return (
    <div className="absolute inset-y-0 left-[calc(var(--u)*338)] w-[calc(var(--u)*742)]">
      {/* Brand header */}
      <div className="absolute top-[calc(var(--u)*48.9)] left-[calc(var(--u)*26.8)] flex h-[calc(var(--u)*44)] items-center">
        <span className="flex size-[calc(var(--u)*44)] items-center justify-center rounded-full bg-flame">
          <Pill className="size-[calc(var(--u)*25)] -rotate-45 text-white" strokeWidth={2.2} />
        </span>
        <span className={cn("ml-[calc(var(--u)*17.5)] text-[length:calc(var(--u)*28)] font-medium whitespace-nowrap", TRIM)}>
          {MOCK.brand}
        </span>
      </div>

      <p className={cn("absolute top-[calc(var(--u)*166.6)] left-[calc(var(--u)*48.8)] text-[length:calc(var(--u)*22)] font-medium", TRIM)}>
        {MOCK.view}
      </p>

      {/* Date range control */}
      <div className="absolute top-[calc(var(--u)*231.4)] left-[calc(var(--u)*54.8)] flex h-[calc(var(--u)*43.1)] w-[calc(var(--u)*370.6)] items-stretch rounded-[calc(var(--u)*3.9)] border-[length:calc(var(--u)*1.1)] border-[#d5d5d5] text-[length:calc(var(--u)*16.5)] text-[#464646]">
        <span className="flex w-[calc(var(--u)*39.3)] items-center justify-center border-r-[length:calc(var(--u)*1.1)] border-[#d5d5d5]">
          <ChevronLeft className="size-[calc(var(--u)*17)] text-[#767676]" strokeWidth={2} />
        </span>
        <span className="flex flex-1 items-center pl-[calc(var(--u)*14.4)]">
          <Calendar className="size-[calc(var(--u)*21)] text-[#767676]" strokeWidth={2} />
          <span className={cn("ml-[calc(var(--u)*14.5)]", TRIM)}>{MOCK.rangeFrom}</span>
          <ArrowRight className="mx-[calc(var(--u)*14.5)] size-[calc(var(--u)*13)] text-[#767676]" strokeWidth={2} />
          <span className={TRIM}>{MOCK.rangeTo}</span>
        </span>
        <span className="flex w-[calc(var(--u)*39.3)] items-center justify-center border-l-[length:calc(var(--u)*1.1)] border-[#d5d5d5]">
          <ChevronRight className="size-[calc(var(--u)*17)] text-[#767676]" strokeWidth={2} />
        </span>
      </div>
      <span className="absolute top-[calc(var(--u)*232.5)] left-[calc(var(--u)*441.9)] flex h-[calc(var(--u)*40.9)] w-[calc(var(--u)*68.4)] items-center justify-center rounded-[calc(var(--u)*3.9)] border-[length:calc(var(--u)*1.1)] border-[#d5d5d5] bg-[#f3f3f3] text-[length:calc(var(--u)*16.5)] text-[#464646]">
        <span className={cn("font-medium", TRIM)}>{MOCK.today}</span>
      </span>

      {/* Table: header + three engine rows */}
      <div className="absolute top-[calc(var(--u)*606.5)] left-[calc(var(--u)*48.2)] h-[calc(var(--u)*48)] w-[calc(var(--u)*900)] text-[length:calc(var(--u)*15)]">
        <span className={cn("absolute top-[calc(var(--u)*19.4)] left-[calc(var(--u)*25.1)]", TRIM)}>{MOCK.columns[0]}</span>
        <span className={cn("absolute top-[calc(var(--u)*19.4)] left-[calc(var(--u)*306.4)]", TRIM)}>{MOCK.columns[1]}</span>
        <span className={cn("absolute top-[calc(var(--u)*19.4)] left-[calc(var(--u)*507.7)]", TRIM)}>{MOCK.columns[2]}</span>
      </div>
      {ROWS.map((row, i) => (
        <div
          key={row.name}
          className={cn(
            "absolute left-[calc(var(--u)*48.2)] flex h-[calc(var(--u)*82)] w-[calc(var(--u)*578.4)] items-center rounded-[calc(var(--u)*6.4)] bg-offwhite text-[length:calc(var(--u)*17)]",
            ROW_SLOTS[i].top,
            ROW_SLOTS[i].fade,
          )}
        >
          <span
            className={cn(
              "absolute left-[calc(var(--u)*18.5)] flex size-[calc(var(--u)*42)] items-center justify-center rounded-full text-[length:calc(var(--u)*17)] font-semibold",
              row.tint,
            )}
          >
            {row.initial}
          </span>
          <span className={cn("absolute left-[calc(var(--u)*79.2)]", TRIM)}>{row.name}</span>
          <span className={cn("absolute left-[calc(var(--u)*306.3)]", TRIM)}>{row.share}</span>
          <span className={cn("absolute left-[calc(var(--u)*507.6)]", TRIM)}>{row.accuracy}</span>
        </div>
      ))}
    </div>
  );
}

/** Gridlines, axis labels and bars, drawn in the comp's 1080-unit space so hairlines render like the Lottie. */
function Chart() {
  return (
    <svg viewBox="0 0 1080 1080" className="absolute inset-0 size-full" aria-hidden="true">
      {GRID_Y.map((y) => (
        <line key={y} x1={626.9} x2={1114.4} y1={y} y2={y} stroke="#949494" strokeWidth={1.077} />
      ))}
      <line x1={625.7} x2={1114.2} y1={BASE_Y} y2={BASE_Y} stroke="#979797" strokeWidth={1.077} />
      {Y_LABELS.map((label) => (
        <text key={label.text} x={600} y={label.y + 5.5} fontSize={15} textAnchor="end" fill="#000">
          {label.text}
        </text>
      ))}
      {BARS.map((bar, i) => {
        const x = BAR_X0 + i * BAR_PITCH;
        return (
          <g key={bar.label}>
            <g className={styles.bar}>
              <rect x={x} y={BASE_Y - bar.base} width={BAR_W} height={bar.base} fill="#4e72f6" />
              {bar.top > 0 && (
                <rect x={x} y={BASE_Y - bar.base - bar.top} width={BAR_W} height={bar.top} fill="#d6e0ff" />
              )}
            </g>
            <text x={x + BAR_W / 2} y={700.9} fontSize={14} textAnchor="middle" fill="#000">
              {bar.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Cartoon hand cursor pointing left (thumb up, curled fingers, cuffed wrist), drawn in the Lottie's units:
 * ~104×78 with a 3.45 outline. The fingertip sits at x 440, on the vertical centre of the Overview pill.
 */
function HandPointer() {
  return (
    <svg
      viewBox="-2 -2 108 82"
      aria-hidden="true"
      className={cn(
        "absolute top-[calc(var(--u)*276)] left-[calc(var(--u)*437.2)] h-[calc(var(--u)*82)] w-[calc(var(--u)*108)]",
        styles.pointer,
      )}
    >
      <g fill="#fff" stroke="#000" strokeWidth={3.45} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4 L46 13 C44 5 52 -1 58 2 C63 5 66 12 70 18 C80 26 90 36 101 47 L84 76 C76 72 62 66 52 62 C44 62 42 54 48 52 C38 52 36 43 44 41 C34 40 33 31 42 29 L10 18 A7 7 0 0 1 9 4 Z" />
        <path fill="none" d="M48 52 L55 51 M44 41 L53 40 M42 29 L50 28.5" />
      </g>
    </svg>
  );
}
