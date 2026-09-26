import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MockFrame } from "./MockFrame";
import s from "./mocks.module.css";
import { R4_75, R9, T12, T13_3, T8_5, T9, T9_3 } from "./parts";

// 7shifts "Retain" anatomy on the royal panel: a centred white card (title, sub line, content, full-width navy button).
// The smiley row becomes an 8-week share-of-voice chart; the lime chips become the before/after pair.

// Chart geometry in SVG user units (= stage units): plot x 22 → 252, y 124 (20%) → 18 (60%).
const VALUES = [34, 33, 34, 34, 38, 44, 49, 52] as const;
const X0 = 22;
const X1 = 252;
const Y_BASE = 124;
const Y_TOP = 18;
const yOf = (v: number) => Y_BASE - ((v - 20) / 40) * (Y_BASE - Y_TOP);
const POINTS = VALUES.map((v, i) => [X0 + (i * (X1 - X0)) / (VALUES.length - 1), yOf(v)] as const);
const MARKER_X = (POINTS[3][0] + POINTS[4][0]) / 2;
const GRID = [30, 40, 50] as const;

/** Catmull-Rom through the weekly points, as cubic Béziers. */
function smoothPath(points: readonly (readonly [number, number])[]): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [points[Math.max(0, i - 1)], points[i], points[i + 1], points[Math.min(points.length - 1, i + 2)]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  return d;
}

const LINE = smoothPath(POINTS);
const AREA = `${LINE} L${X1} ${Y_BASE} L${X0} ${Y_BASE} Z`;

// The line draws linearly from 500 ms for 1.3 s; each point pops when the stroke reaches it (arc-length fractions).
const POINT_DELAYS = [
  "[--mock-d:500ms]",
  "[--mock-d:680ms]",
  "[--mock-d:860ms]",
  "[--mock-d:1040ms]",
  "[--mock-d:1225ms]",
  "[--mock-d:1420ms]",
  "[--mock-d:1615ms]",
  "[--mock-d:1800ms]",
] as const;

const SVG_POP = "[transform-box:fill-box] origin-center";

export function MeasureMock() {
  const [lastX, lastY] = POINTS[POINTS.length - 1];
  return (
    <MockFrame kind="measure" className="bg-royal">
      {/* Chart card: 300 x 324 at (110, 98), r 9 (7shifts feedback card: 272.9 wide, r 9; widened for the chart). */}
      <div className={cn("absolute top-98 left-110 h-324 w-300 bg-white", R9, s.fadeUp)}>
        <p className={cn(T13_3, "absolute inset-x-0 top-22 text-center leading-[1.2] font-medium")}>
          Share of voice · [brand]
        </p>
        <p className={cn(T9_3, "absolute inset-x-0 top-43 text-center leading-none text-black/75")}>
          Last 8 weeks · 4 AI engines
        </p>

        <svg viewBox="0 0 260 148" fill="none" className="absolute top-64 left-20 h-148 w-260 overflow-visible">
          <defs>
            <linearGradient id="mock-sov-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#4570ff" stopOpacity="0.22" />
              <stop offset="1" stopColor="#4570ff" stopOpacity="0" />
            </linearGradient>
          </defs>

          <g className={cn("[--mock-d:200ms]", s.fadeIn)}>
            {GRID.map((v) => (
              <g key={v}>
                <line x1={X0} x2={258} y1={yOf(v)} y2={yOf(v)} stroke="#f1f0ec" />
                <text x={0} y={yOf(v) + 2.8} fontSize={8} fill="#878787">
                  {v}%
                </text>
              </g>
            ))}
            <line x1={X0} x2={258} y1={Y_BASE} y2={Y_BASE} stroke="#e2ded6" />
            <text x={X0} y={140} fontSize={8} fill="#878787" textAnchor="middle">
              W1
            </text>
            <text x={X1} y={140} fontSize={8} fill="#878787" textAnchor="middle">
              W8
            </text>
          </g>

          <path d={AREA} fill="url(#mock-sov-area)" className={cn("[--mock-d:1500ms] [--mock-t:500ms]", s.fadeIn)} />

          {/* "Fix published" marker between week 4 and week 5. */}
          <line
            x1={MARKER_X}
            x2={MARKER_X}
            y1={18}
            y2={Y_BASE}
            stroke="#193f78"
            strokeDasharray="2.5 2.5"
            className={cn("[--mock-d:1100ms] [--mock-t:300ms]", s.fadeIn)}
          />
          <g className={cn(SVG_POP, "[--mock-d:1150ms]", s.popSettle)}>
            <rect x={MARKER_X - 31} y={2} width={62} height={13} rx={3} fill="#193f78" />
            <text x={MARKER_X} y={11.1} fontSize={7.5} fontWeight={500} fill="#fff" textAnchor="middle">
              Fix published
            </text>
          </g>

          <path
            d={LINE}
            pathLength={1}
            stroke="#4570ff"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("[--mock-d:500ms] [--mock-ease:linear] [--mock-t:1300ms]", s.draw)}
          />

          {POINTS.slice(0, -1).map(([x, y], i) => (
            <circle
              key={x}
              cx={x}
              cy={y}
              r={2.75}
              fill="#fff"
              stroke="#4570ff"
              strokeWidth={1.75}
              className={cn(SVG_POP, s.pop, POINT_DELAYS[i])}
            />
          ))}
          <circle
            cx={lastX}
            cy={lastY}
            r={3.75}
            className={cn(SVG_POP, "fill-royal/45 [--mock-loop-d:2200ms] [--mock-pulse-scale:3]", s.pulse)}
          />
          <circle
            cx={lastX}
            cy={lastY}
            r={3.75}
            fill="#4570ff"
            stroke="#fff"
            strokeWidth={1.5}
            className={cn(SVG_POP, s.pop, POINT_DELAYS[POINT_DELAYS.length - 1])}
          />
        </svg>

        <span
          className={cn(
            T8_5,
            "absolute top-77 right-22 flex h-16 items-center rounded-full bg-lime px-6 leading-none font-semibold [--mock-d:1850ms]",
            s.popBounce
          )}
        >
          +18 pts
        </span>

        <div className="absolute inset-x-20 top-226 flex h-28 items-center justify-center gap-8">
          <span className={cn(T9, "flex h-28 items-center gap-5 rounded-full border border-sand bg-offwhite px-12 leading-none")}>
            <span className="text-stone">Before</span>
            <span className={cn(T12, "font-medium")}>34%</span>
          </span>
          <ArrowRight className="size-12 text-black/40" strokeWidth={2} />
          <span
            className={cn(
              T9,
              "flex h-28 items-center gap-5 rounded-full bg-lime px-12 leading-none [--mock-d:2050ms]",
              s.popBounce
            )}
          >
            <span className="text-black/60">After</span>
            <span className={cn(T12, "font-medium")}>52%</span>
          </span>
        </div>

        <span
          className={cn(
            T8_5,
            "absolute inset-x-20 top-270 flex h-31.75 items-center justify-center bg-navy leading-none font-medium text-white",
            R4_75
          )}
        >
          Share report
        </span>
      </div>
    </MockFrame>
  );
}
