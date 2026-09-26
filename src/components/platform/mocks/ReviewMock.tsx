import { CheckCircleIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { MockFrame } from "./MockFrame";
import s from "./mocks.module.css";
import { Cursor, R10_25, R4_75, T10_45, T12, T7_5, T8, T8_5, T9_3 } from "./parts";

// 7shifts "Pay" anatomy on the forest panel: a wide white card with a flame progress bar and step labels, a title row,
// pastel stat pills and #FBFAF8 rows; the cursor clicks the navy primary button.
const CHECKS = [
  { label: "Claims matched", result: "12/12" },
  { label: "Fair balance", result: "Pass" },
  { label: "ISI present and current", result: "Pass" },
  { label: "Banned phrases", result: "0" },
] as const;

const ROW_DELAYS = ["[--mock-d:350ms]", "[--mock-d:440ms]", "[--mock-d:530ms]", "[--mock-d:620ms]"] as const;
const CHECK_DELAYS = ["[--mock-d:700ms]", "[--mock-d:820ms]", "[--mock-d:940ms]", "[--mock-d:1060ms]"] as const;

const STEPS = ["Claims", "Fair balance", "Sign-off"] as const;

function Avatar({ initials, className }: { initials: string; className: string }) {
  return (
    <span
      className={cn(
        T7_5,
        "grid size-20 place-items-center rounded-full leading-none font-medium ring-[1.5px] ring-white",
        className
      )}
    >
      {initials}
    </span>
  );
}

export function ReviewMock() {
  return (
    <MockFrame kind="review" className="bg-forest">
      {/* Review card: 450.25 x 330 at (34.75, 95), r 10.25 (7shifts payroll card: 450.3 wide, r 10.2). */}
      <div className={cn("absolute top-95 left-34.75 h-330 w-450.25 bg-white px-12.25 pt-14.75", R10_25, s.fadeUp)}>
        <div className="relative h-5.75 overflow-hidden rounded-full bg-[#f3f3f2]">
          <span
            className={cn(
              "absolute inset-y-0 left-0 w-[88%] origin-left rounded-full bg-flame [--mock-d:300ms] [--mock-t:1000ms]",
              s.fillX
            )}
          />
        </div>
        <div className={cn(T8, "mt-5 grid grid-cols-3 text-center leading-none")}>
          {STEPS.map((step, i) => (
            <span key={step} className={i === STEPS.length - 1 ? "text-black" : "text-black/50"}>
              {step}
            </span>
          ))}
        </div>

        <div className="mt-15 flex h-20 items-center justify-between">
          <p className={cn(T12, "leading-none font-medium")}>Pre-MLR review</p>
          <div className="flex items-center gap-7">
            <span className={cn(T8_5, "leading-none text-stone")}>Reviewers</span>
            <span className="flex -space-x-3">
              <Avatar initials="MA" className="bg-lavender text-eggplant" />
              <Avatar initials="RL" className="bg-periwinkle text-navy" />
            </span>
          </div>
        </div>

        <div className={cn(T8_5, "mt-9 flex h-17 gap-6 leading-none")}>
          <span className={cn("flex items-center rounded-full bg-lime px-8 [--mock-d:500ms]", s.popSettle)}>
            Risk score:&nbsp;<span className="font-semibold">Low</span>
          </span>
          <span className={cn("flex items-center rounded-full bg-lavender px-8 [--mock-d:600ms]", s.popSettle)}>
            Page: How is [brand] dosed?
          </span>
        </div>

        <div className={cn(T8_5, "mt-10 flex h-20 items-center justify-between px-10 pr-12 leading-none text-black/75")}>
          <span>Check</span>
          <span>Result</span>
        </div>
        <div className="flex flex-col gap-2.75">
          {CHECKS.map((check, i) => (
            <div
              key={check.label}
              className={cn(
                "flex h-36 items-center justify-between bg-offwhite pr-12 pl-10 [--mock-rise:8]",
                R4_75,
                s.fadeUp,
                ROW_DELAYS[i]
              )}
            >
              <span className="flex items-center gap-8">
                <CheckCircleIcon
                  checkColor="#000"
                  className={cn("size-18 shrink-0 text-lime", s.popSettle, CHECK_DELAYS[i])}
                />
                <span className={cn(T10_45, "leading-none font-medium")}>{check.label}</span>
              </span>
              <span className={cn(T10_45, "leading-none font-medium")}>{check.result}</span>
            </div>
          ))}
        </div>

        <div className={cn(T9_3, "absolute right-12.25 bottom-15 flex h-26 gap-8 leading-none font-medium")}>
          <span className={cn("flex items-center border border-navy/30 bg-white px-12 text-navy", R4_75)}>
            Export to Veeva PromoMats
          </span>
          <span
            className={cn("flex items-center bg-navy px-18 text-white [--mock-loop-d:1600ms]", R4_75, s.press)}
          >
            Approve
          </span>
        </div>
      </div>

      <Cursor className={cn("top-401.25 left-446.25 [--mock-loop-d:1600ms]", s.cursorReview)} />
    </MockFrame>
  );
}
