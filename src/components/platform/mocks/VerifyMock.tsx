import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { CheckIcon, XIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { MockFrame } from "./MockFrame";
import s from "./mocks.module.css";
import { R14, R20, R3, R4, R6, T11_5, T13, T8_5, T9, T9_3 } from "./parts";

// 7shifts "Train" anatomy: an off-white table card bleeding off the right edge of an oat panel, with a white modal
// (soft shadow) floating over it. The modal's lime file row becomes the label row; its red PDF icon the alert icon.
const LOG = [
  { prompt: "How is [brand] dosed?", result: "2 conflicts", bad: true },
  { prompt: "Max daily dose of [brand]?", result: "Matches label", bad: false },
  { prompt: "Can I take [brand] with food?", result: "Matches label", bad: false },
  { prompt: "Is [brand] safe long-term?", result: "Matches label", bad: false },
  { prompt: "[Brand] vs Competitor X", result: "Matches label", bad: false },
] as const;

function Mark({ tone, delay, children }: { tone: "bad" | "good"; delay: string; children: ReactNode }) {
  return (
    <span className="relative whitespace-nowrap">
      <span
        className={cn(
          "absolute -inset-x-1.5 -inset-y-0.5 origin-left",
          R3,
          tone === "bad" ? "bg-[#fa596d]/22" : "bg-lime",
          s.fillX,
          "[--mock-t:500ms]",
          delay
        )}
      />
      <span className={cn("relative font-medium", tone === "bad" ? "text-[#b3263a]" : "text-forest")}>{children}</span>
    </span>
  );
}

function CompareRow({
  tone,
  label,
  children,
  className,
  boxDelay,
}: {
  tone: "bad" | "good";
  label: string;
  children: ReactNode;
  className: string;
  boxDelay: string;
}) {
  const bad = tone === "bad";
  return (
    <div
      className={cn(
        "flex h-48 items-center justify-between border pr-11 pl-12 [--mock-rise:8]",
        R6,
        bad ? "border-[#ffc9cf] bg-[#fff0f1]" : "border-lime bg-[#e5ffcf]",
        s.fadeUp,
        className
      )}
    >
      <div>
        <p className={cn(T8_5, "leading-none text-[#868686]")}>{label}</p>
        <p className={cn(T11_5, "mt-5 leading-[1.2]")}>{children}</p>
      </div>
      <span
        className={cn(
          "grid size-22 shrink-0 place-items-center",
          R4,
          bad ? "bg-[#fa596d] text-white" : "bg-lime text-forest",
          s.popSettle,
          boxDelay
        )}
      >
        {bad ? <XIcon className="size-11" /> : <CheckIcon className="size-12" />}
      </span>
    </div>
  );
}

function Chip({ ok, children, className }: { ok: boolean; children: ReactNode; className: string }) {
  return (
    <span
      className={cn(
        T9_3,
        "flex h-22 items-center gap-4 rounded-full border px-9 leading-none font-medium",
        ok ? "border-lime bg-[#e5ffcf] text-forest" : "border-[#ffc9cf] bg-[#fff0f1] text-[#b3263a]",
        s.popSettle,
        className
      )}
    >
      {children}
      {ok ? <CheckIcon className="size-9" /> : <XIcon className="size-8.5" />}
    </span>
  );
}

export function VerifyMock() {
  return (
    <MockFrame kind="verify" className="bg-oat">
      {/* Answer log: #FBFAF8 card at (34, 59), 401 high, r 20, bleeding off the right edge like 7shifts' course table. */}
      <div
        className={cn(
          "absolute top-59 left-34 h-401 w-560 bg-offwhite shadow-[0_4px_24px_rgba(0,0,0,0.1)]",
          R20,
          s.fadeUp
        )}
      >
        <div className={cn(T13, "flex h-68 items-end pb-16 leading-none font-medium text-black/80")}>
          <span className="w-277 pl-24">Prompt</span>
          <span>Accuracy</span>
        </div>
        {LOG.map((row) => (
          <div key={row.prompt} className={cn(T13, "flex h-64 items-center border-t-2 border-[#efefed] leading-none")}>
            <span className="w-277 pl-24 text-stone">{row.prompt}</span>
            <span className={row.bad ? "font-medium text-[#d63a4f]" : "text-stone"}>{row.result}</span>
          </div>
        ))}
      </div>

      {/* Alert modal: white 320 x 218 at (104, 176), r 14, soft shadow (7shifts "Upload your SOPs"). */}
      <div
        className={cn(
          "absolute top-176 left-104 w-320 bg-white p-20 shadow-[0_4px_20px_rgba(0,0,0,0.08)] [--mock-d:200ms]",
          R14,
          s.zoomIn
        )}
      >
        <div className="flex h-28 items-center gap-10">
          <span className={cn("relative grid size-28 shrink-0 place-items-center bg-[#fa596d] text-white", R6)}>
            <span
              className={cn(
                "absolute inset-0 border-2 border-[#fa596d] [--mock-loop-d:1600ms] [--mock-pulse-scale:1.55]",
                R6,
                s.pulse
              )}
            />
            <TriangleAlert className="size-14" strokeWidth={2.25} />
          </span>
          <div>
            <p className={cn(T13, "leading-[1.2] font-medium")}>2 AI answers state the wrong dose</p>
            <p className={cn(T9, "mt-3 leading-none text-[#868686]")}>Checked against your label</p>
          </div>
        </div>

        <CompareRow
          tone="bad"
          label="AI answer · ChatGPT"
          className="mt-12 [--mock-d:450ms]"
          boxDelay="[--mock-d:950ms]"
        >
          Start with <Mark tone="bad" delay="[--mock-d:850ms]">300 mg twice daily</Mark>.
        </CompareRow>
        <CompareRow
          tone="good"
          label="Label · Section 2.1"
          className="mt-8 [--mock-d:570ms]"
          boxDelay="[--mock-d:1100ms]"
        >
          Start with <Mark tone="good" delay="[--mock-d:1000ms]">150 mg once daily</Mark>.
        </CompareRow>

        <div className="mt-12 flex gap-6">
          <Chip ok={false} className="[--mock-d:1200ms]">
            Dose
          </Chip>
          <Chip ok className="[--mock-d:1300ms]">
            Indication
          </Chip>
          <Chip ok className="[--mock-d:1400ms]">
            Boxed warning
          </Chip>
        </div>
      </div>
    </MockFrame>
  );
}

