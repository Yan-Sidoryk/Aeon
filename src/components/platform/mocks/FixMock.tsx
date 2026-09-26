import { Braces, FileText, Lock, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MockFrame } from "./MockFrame";
import s from "./mocks.module.css";
import { R12_5, R3, R4, R4_75, R6, T11, T11_5, T8_5, T9, T9_3 } from "./parts";

// 7shifts "Schedule" anatomy on the flame panel: a small card overlapping a larger white card. The large card's
// flame-topped #FBFAF8 day column becomes the "Direct answer" block; the pastel shift pills become claim chips.

function ClaimChip({ children, className }: { children: ReactNode; className: string }) {
  return (
    <span
      className={cn(
        T8_5,
        "ml-2 inline-flex h-15 translate-y-[-8%] items-center bg-periwinkle px-5 align-middle leading-none font-medium whitespace-nowrap text-navy",
        R4,
        s.popSettle,
        className
      )}
    >
      {children}
    </span>
  );
}

export function FixMock() {
  return (
    <MockFrame kind="fix" className="bg-flame">
      {/* Draft document: 423.5 x 296 at (47, 131), r 12.5 (7shifts schedule card: 423.5 wide, r 12.4). */}
      <div className={cn("absolute top-131 left-47 h-296 w-423.5 bg-white px-20 pt-20", R12_5, s.zoomIn)}>
        <div className="flex h-22 items-center justify-between">
          <div className="flex items-center gap-8">
            <span className={cn("grid size-22 place-items-center bg-flame/12 text-flame", R4)}>
              <FileText className="size-12" strokeWidth={2} />
            </span>
            <p className={cn(T11_5, "leading-none font-medium")}>Draft: How is [brand] dosed?</p>
          </div>
          <span
            className={cn(
              T8_5,
              "flex h-20 items-center gap-4 rounded-full bg-lavender px-8 leading-none font-medium text-eggplant [--mock-d:850ms]",
              s.popSettle
            )}
          >
            <Braces className="size-9" strokeWidth={2.25} />
            FAQPage schema
          </span>
        </div>

        {/* "Direct answer" block: #FBFAF8 with the 3.5-unit flame top bar of 7shifts' active day column. */}
        <div
          className={cn(
            "relative mt-14 h-80 overflow-hidden bg-offwhite px-12 pt-13 [--mock-d:150ms] [--mock-rise:10]",
            R6,
            s.fadeUp
          )}
        >
          <span className="absolute inset-x-0 top-0 h-3.5 bg-flame" />
          <p className={cn(T8_5, "flex items-center gap-4 leading-none font-medium text-black/60")}>
            <Sparkles className="size-9 text-[#4e72f6]" strokeWidth={2.25} />
            Direct answer
          </p>
          <p className={cn(T11, "mt-7 leading-[1.5]")}>
            [Brand] is taken as 150 mg once daily, with or without food. Swallow the tablet whole.
            <ClaimChip className="[--mock-d:600ms]">PI §2.1</ClaimChip>
          </p>
        </div>

        <p className={cn(T11, "mt-14 leading-[1.5] text-black/80 [--mock-d:260ms] [--mock-rise:10]", s.fadeUp)}>
          Check liver tests before the first dose.
          <ClaimChip className="[--mock-d:725ms]">PI §5.3</ClaimChip>
        </p>

        {/* The unreferenced sentence, struck out and locked. */}
        <p
          className={cn(
            T11,
            "mt-7 inline-flex h-18 items-center gap-5 bg-[#fff0f1] px-5 leading-none text-[#b3263a] [--mock-d:360ms] [--mock-rise:10]",
            R3,
            s.fadeUp
          )}
        >
          <Lock className="size-9" strokeWidth={2.5} />
          <span className="relative">
            Relief starts within days.
            <span
              className={cn(
                "absolute inset-x-0 top-1/2 h-px origin-left bg-current [--mock-d:1100ms] [--mock-t:400ms]",
                s.fillX
              )}
            />
          </span>
        </p>

        <div className="mt-13 flex flex-col gap-9">
          <span className={cn("h-6.5 w-[86%] rounded-full bg-sand [--mock-d:450ms] [--mock-rise:6]", s.fadeUp)} />
          <span className="flex items-center gap-4">
            <span className={cn("h-6.5 w-[58%] rounded-full bg-sand [--mock-d:520ms] [--mock-rise:6]", s.fadeUp)} />
            <span className={cn("h-12 w-1.25 bg-black [--mock-loop-d:1800ms]", s.caret)} />
          </span>
        </div>

        <div className="absolute inset-x-20 bottom-20 flex h-24 items-center justify-between">
          <span className={cn(T9, "leading-none text-stone")}>2 claims · 2 approved sources</span>
          <span className={cn(T9_3, "flex h-24 items-center bg-navy px-12 leading-none font-medium text-white", R4_75)}>
            Send to review
          </span>
        </div>
      </div>

      {/* Toast: overlaps the document's top-right corner like 7shifts' shift editor overlaps its schedule card. */}
      <div
        className={cn(
          "absolute top-93 left-250 flex h-52 w-236 items-center gap-10 bg-white px-12 shadow-[0_6px_18px_rgba(0,0,0,0.14)] [--mock-d:1300ms]",
          "rounded-[calc(var(--spacing)*10)]",
          s.dropIn
        )}
      >
        <span className="grid size-28 shrink-0 place-items-center rounded-full bg-flame/12 text-flame">
          <Lock className="size-13" strokeWidth={2.25} />
        </span>
        <div>
          <p className={cn(T11, "leading-none font-medium")}>Unreferenced claim blocked</p>
          <p className={cn(T8_5, "mt-5 leading-none text-stone")}>No approved source found</p>
        </div>
      </div>
    </MockFrame>
  );
}
