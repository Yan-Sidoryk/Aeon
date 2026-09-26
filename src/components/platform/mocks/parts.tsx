import { cn } from "@/lib/utils";
import s from "./mocks.module.css";

/*
 * Shared atoms for the platform mocks. Everything is sized in stage units (var(--spacing) = 1px at a 520px panel),
 * so the mock scales like 7shifts' Lottie SVGs. Values are the 7shifts measurements in the spec.
 */

/** Font sizes on the stage. Names are design px at 520 (Inter Tight matched to the Lottie font by cap height). */
export const T7_5 = "text-[length:calc(var(--spacing)*7.5)]";
export const T8 = "text-[length:calc(var(--spacing)*8)]";
export const T8_5 = "text-[length:calc(var(--spacing)*8.5)]";
export const T9 = "text-[length:calc(var(--spacing)*9)]";
export const T9_3 = "text-[length:calc(var(--spacing)*9.3)]";
export const T10_45 = "text-[length:calc(var(--spacing)*10.45)]";
export const T11 = "text-[length:calc(var(--spacing)*11)]";
export const T11_5 = "text-[length:calc(var(--spacing)*11.5)]";
export const T12 = "text-[length:calc(var(--spacing)*12)]";
export const T13 = "text-[length:calc(var(--spacing)*13)]";
export const T13_3 = "text-[length:calc(var(--spacing)*13.3)]";
export const T17_5 = "text-[length:calc(var(--spacing)*17.5)]";

/** Corner radii on the stage. */
export const R3 = "rounded-[calc(var(--spacing)*3)]";
export const R4 = "rounded-[calc(var(--spacing)*4)]";
export const R4_75 = "rounded-[calc(var(--spacing)*4.75)]";
export const R6 = "rounded-[calc(var(--spacing)*6)]";
export const R9 = "rounded-[calc(var(--spacing)*9)]";
export const R10_25 = "rounded-[calc(var(--spacing)*10.25)]";
export const R12_5 = "rounded-[calc(var(--spacing)*12.5)]";
export const R14 = "rounded-[calc(var(--spacing)*14)]";
export const R20 = "rounded-[calc(var(--spacing)*20)]";

/**
 * 7shifts' Lottie mouse pointer: white arrow, black outline, round joins (13.2 x 17.9 at 520).
 * The tip sits 0.75 units inside the top-left corner; position the element at (tipX - 0.75, tipY - 0.75).
 */
export function Cursor({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-1.5 -1.5 30 40"
      fill="none"
      className={cn("pointer-events-none absolute h-19.75 w-14.75 origin-[5%_4%] overflow-visible", className)}
    >
      <path
        d="M0 0L3.75 35.47L10.35 25.57L16.37 36.34L22.24 32.34L15.46 22.7L26.79 21.42Z"
        fill="#fff"
        stroke="#000"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type DrawnCheckProps = {
  className?: string;
  /** Timing knobs for the draw, e.g. "[--mock-d:1100ms]" (they do not inherit, so they go on the path). */
  drawClassName?: string;
  strokeWidth?: number;
};

/** Check mark drawn with stroke-dashoffset (7shifts draws it with a trim-path matte). */
export function DrawnCheck({ className, drawClassName, strokeWidth = 2.4 }: DrawnCheckProps) {
  return (
    <svg viewBox="0 0 20 15" fill="none" className={className}>
      <path
        d="M1.4 7.6L7 13.1L18.6 1.4"
        pathLength={1}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(s.draw, drawClassName)}
      />
    </svg>
  );
}
