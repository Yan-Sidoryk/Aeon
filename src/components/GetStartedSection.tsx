import { RevealCard } from "@/components/get-started/RevealCard";
import { CheckCircleIcon } from "@/components/icons";
import { PillButton, START_HREF } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";

// Anatomy, spacing, type and motion follow 7shifts' "Get running in under 30 days" timeline; values and
// states are documented in docs/research/components/GetStartedSection.spec.md. Copy: docs/research/AEON_CONTENT.md §9.
// Breakpoints are 7shifts' own: "md" switches at 810px (min-[810px]:), "lg" at 1024px (lg:).

type TimelineStep = {
  pill: string;
  title: string;
  items: readonly string[];
  /** Card background (7shifts light-purple / sky-blue / lime-green). */
  cardClassName: string;
  /** 7shifts' check is cut out of the black circle, so it shows the card color. */
  checkColor: string;
};

const HEADING = "Your first AI visibility report in 5 minutes";
const SUBHEADING =
  "Type your company website. Aeon finds your portfolio, competitors and the questions people ask, then runs a live scan.";
const CTA_LABEL = "Start your free report";

const STEPS: readonly TimelineStep[] = [
  {
    pill: "Minute 1",
    title: "Enter your website.",
    items: [
      "Portfolio found from your site and FDA labels",
      "Competitors and prompts pre-filled",
      "Pick one hero drug to start",
    ],
    cardClassName: "bg-lavender",
    checkColor: "#ebdcff",
  },
  {
    pill: "Minute 5",
    title: "Read your first report.",
    items: ["Visibility score vs. your top competitor", "Answers that contradict the label", "Top 3 fixes, one click each"],
    cardClassName: "bg-periwinkle",
    checkColor: "#d6e0ff",
  },
  {
    pill: "Day 30",
    title: "Ship your first fix.",
    items: ["Draft approved through pre-MLR", "Weekly re-scans across your portfolio", "Before and after you can share"],
    cardClassName: "bg-lime",
    checkColor: "#c6ff94",
  },
];

export function GetStartedSection() {
  return (
    <div data-section="get-started" className="relative z-10 -my-[60px] bg-white py-[60px]">
      <section
        aria-labelledby="get-started-heading"
        className="flex justify-center rounded-b-[40px] bg-white px-5 py-10 min-[810px]:px-[60px] min-[810px]:py-20 lg:px-20"
      >
        <div className="flex w-full max-w-[1200px] flex-col gap-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <h2
              id="get-started-heading"
              className="font-display text-[28px] leading-[1.1] font-medium min-[810px]:text-4xl min-[810px]:tracking-[-0.88px] lg:text-5xl"
            >
              {HEADING}
            </h2>
            <p className="text-base leading-[1.5] min-[810px]:text-lg">{SUBHEADING}</p>
            <PillButton href={START_HREF} variant="primary">
              {CTA_LABEL}
            </PillButton>
          </div>

          <div className="flex flex-col gap-5">
            {/* Desktop timeline: step pills above a hairline with one dot per step. */}
            <div className="hidden flex-col gap-2.5 min-[810px]:flex" aria-hidden="true">
              <div className="flex gap-[60px]">
                {STEPS.map((step) => (
                  <div key={step.pill} className="flex flex-1 justify-center">
                    <div className="rounded-full bg-sand px-4 py-2">
                      <p className="font-display text-xs font-medium whitespace-nowrap">{step.pill}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="relative flex gap-[60px]">
                <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-stone/30" />
                {STEPS.map((step) => (
                  <div key={step.pill} className="relative z-10 flex flex-1 items-center justify-center">
                    <div className="size-2.5 shrink-0 rounded-full bg-stone/30" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-5 min-[810px]:flex-row min-[810px]:gap-[60px]">
              {/* 7shifts keeps an (empty) vertical rail in the mobile layout; it collapses to 0px height. */}
              <div className="flex w-2.5 flex-col items-center gap-2.5 min-[810px]:hidden" aria-hidden="true">
                <div className="w-0.5 flex-1 bg-stone/30" />
              </div>
              <ol className="flex flex-1 flex-col gap-5 min-[810px]:flex-row">
                {STEPS.map((step, index) => (
                  <RevealCard
                    key={step.pill}
                    index={index}
                    className={cn("relative flex flex-1 flex-col gap-5 rounded-[20px] p-5", step.cardClassName)}
                  >
                    {/* Mobile: the step pill sits inside the card. Desktop: kept for screen readers only. */}
                    <div className="min-[810px]:sr-only">
                      <div className="inline-block rounded-full bg-violet px-4 py-2">
                        <p className="font-display text-xs font-medium text-black">{step.pill}</p>
                      </div>
                    </div>
                    <h3 className="font-display text-lg leading-[1.1] font-medium min-[810px]:text-[28px]">
                      {step.title}
                    </h3>
                    <ul className="flex flex-col gap-5">
                      {step.items.map((item) => (
                        <li key={item} className="flex items-start gap-5">
                          <div className="mt-0.5 shrink-0">
                            <CheckCircleIcon className="size-5 text-black" checkColor={step.checkColor} />
                          </div>
                          <p className="text-base leading-[1.5] min-[810px]:text-lg">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </RevealCard>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
