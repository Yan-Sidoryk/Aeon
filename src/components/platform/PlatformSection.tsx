import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRightBoldIcon, ArrowThinIcon, CheckCircleIcon } from "@/components/icons";
import { PillButton, START_HREF } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";
import { FixMock, MeasureMock, ReviewMock, TrackMock, VerifyMock } from "./PlatformMocks";
import { PlatformTabBar } from "./PlatformTabBar";
import { PLATFORM_CONTENT, type PlatformStep, type PlatformStepId } from "./platform.content";
import styles from "./platform.module.css";

// Layout follows 7shifts' "Everything your team relies on" block (docs/research/components/PlatformSection.spec.md).
// 7shifts' Tailwind `md` breakpoint is 810px, so this section uses min-[810px]: / max-[810px]: instead of md:.

const SECTION_ID = "platform";
const CARDS_ID = "platform-cards";

const MOCKS: Record<PlatformStepId, ComponentType> = {
  track: TrackMock,
  verify: VerifyMock,
  fix: FixMock,
  review: ReviewMock,
  measure: MeasureMock,
};

// Card text boxes are trimmed to cap height / alphabetic baseline, like 7shifts.
const TRIM = "[text-box-trim:trim-both] [text-box-edge:cap_alphabetic]";

export function PlatformSection() {
  const { heading, sub, cta, steps } = PLATFORM_CONTENT;
  return (
    <section
      id={SECTION_ID}
      data-section="platform"
      aria-labelledby="platform-heading"
      className="relative z-10 -mt-[60px] bg-sand px-[20px] pt-[100px] pb-[120px] min-[810px]:pt-[140px] min-[810px]:text-pretty xl:px-[60px]"
    >
      <h2
        id="platform-heading"
        className="mx-auto mb-[10px] max-w-[1040px] text-center font-display text-[48px] leading-[0.9] font-medium tracking-[-0.03em] min-[810px]:px-[40px] xl:px-0"
      >
        {heading}
      </h2>
      <p className="mx-auto mb-[40px] max-w-[1040px] text-center text-[18px] leading-[1.5em] min-[810px]:px-[40px] xl:px-0">
        {sub}
      </p>
      <PillButton href={START_HREF} className="mx-auto mb-[44px] flex w-fit px-[24px]">
        {cta}
      </PillButton>

      <PlatformTabBar
        tabs={steps.map(({ id, label, icon }) => ({ id, label, icon }))}
        sectionId={SECTION_ID}
        cardsId={CARDS_ID}
      />

      <div
        id={CARDS_ID}
        className="flex flex-col gap-y-[20px] min-[810px]:gap-y-[40px] min-[810px]:px-[40px] xl:gap-y-[80px]"
      >
        {steps.map((step, i) => (
          // Each card sticks 220px from the top; later cards (higher z-index) slide over earlier ones.
          <div
            key={step.id}
            id={`platform-${step.id}`}
            className="min-[810px]:sticky min-[810px]:top-[220px]"
            style={{ zIndex: i }}
          >
            <PlatformCard step={step} Mock={MOCKS[step.id]} />
          </div>
        ))}
      </div>
    </section>
  );
}

function PlatformCard({ step, Mock }: { step: PlatformStep; Mock: ComponentType }) {
  return (
    <div className="xl:mx-auto xl:max-w-[1040px]">
      <article
        aria-labelledby={`platform-${step.id}-title`}
        className="flex flex-col overflow-hidden rounded-[20px] bg-white min-[810px]:flex-row min-[810px]:rounded-none min-[810px]:bg-transparent"
      >
        {/* Visual panel: square like 7shifts' Lottie tiles; the mock fills it edge to edge. */}
        <div className="relative aspect-square min-h-[300px] overflow-hidden rounded-b-[10px] min-[810px]:min-h-[420px] min-[810px]:w-1/2 min-[810px]:rounded-b-none min-[810px]:rounded-l-[20px]">
          <div className="absolute inset-0">
            <Mock />
          </div>
        </div>

        <div className="p-[20px] min-[810px]:flex min-[810px]:w-1/2 min-[810px]:flex-col min-[810px]:justify-center min-[810px]:rounded-r-[20px] min-[810px]:bg-white min-[810px]:p-[40px]">
          <div className="mb-[20px]">
            <Image src={step.icon} alt="" width={60} height={60} className="mb-[10px] h-[60px] w-[60px] p-[8px]" />
            <p className={cn("mb-[10px] font-hand text-[20px] leading-none font-normal text-[#000000bf] min-[810px]:text-[28px]", TRIM)}>
              {step.label}
            </p>
            <h3
              id={`platform-${step.id}-title`}
              className={cn("font-display text-[28px] leading-[1.1] font-medium min-[810px]:text-[36px]", TRIM)}
            >
              {step.title}
            </h3>
          </div>
          <p className={cn("my-[20px] text-[16px] leading-[1.5] font-normal text-[#000000bf]", TRIM)}>{step.body}</p>
          <ul className="mb-[20px] flex flex-col gap-y-[12px]">
            {step.checks.map((check) => (
              <li key={check} className="flex items-center gap-3">
                <CheckCircleIcon className="h-6 w-6 shrink-0 text-[#404040]" />
                <p className={cn("align-middle text-[16px] leading-[1.5] font-normal", TRIM)}>{check}</p>
              </li>
            ))}
          </ul>
          <div className="flex w-full flex-col gap-[10px] min-[810px]:w-fit min-[810px]:flex-row min-[810px]:items-center min-[810px]:justify-start min-[810px]:gap-0">
            <div className="flex flex-col items-start justify-center">
              <Link
                href={step.linkHref}
                className={cn(
                  "group flex items-center gap-2 rounded-full py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 focus-visible:ring-offset-white min-[810px]:-my-1 min-[810px]:ml-0 min-[810px]:-mr-2 min-[810px]:px-2 min-[810px]:py-1",
                  styles.exploreLink
                )}
              >
                {/* 7shifts `.custom-link`: 1px currentColor underline grows from the left on hover. */}
                <span className="relative overflow-hidden font-display text-[16px] leading-none font-medium tracking-normal after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-current after:transition-[width] after:duration-300 after:ease-[ease-in-out] after:content-[''] hover:after:w-full">
                  {step.linkLabel}
                </span>
                {/* Mobile: 7shifts sets a "→" glyph (11px advance); Geist's arrow is far wider, so draw it instead. */}
                <span aria-hidden="true" className="inline-flex h-4 items-center min-[810px]:hidden">
                  <ArrowThinIcon viewBox="2.25 0 11.5 16" width="11.5" height="16" />
                </span>
                <span aria-hidden="true" className={cn("hidden flex-col justify-center text-black min-[810px]:flex", styles.exploreArrow)}>
                  <ArrowRightBoldIcon width="1em" height="1em" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
