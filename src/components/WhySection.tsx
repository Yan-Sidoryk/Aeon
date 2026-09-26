import type { ReactNode } from "react";
import { CheckIcon, XIcon } from "@/components/icons";
import { PillButton, START_HREF } from "@/components/ui/pill-button";
import { AeonAppMock } from "@/components/why/AeonAppMock";
import { OldWayCollage } from "@/components/why/OldWayCollage";
import { cn } from "@/lib/utils";

// Layout follows 7shifts' "Why connected work wins" block (docs/research/components/WhySection.spec.md).
// The theme's screens match 7shifts (md 810px, xl 1200px), so 7shifts' md:/xl: classes are copied as-is.

type WhyCardCopy = {
  eyebrow: string;
  title: string;
  points: readonly [string, string, string];
};

type WhyCopy = {
  heading: string;
  sub: string;
  oldWay: WhyCardCopy;
  newWay: WhyCardCopy;
  cta: string;
  micro: string;
};

const WHY_COPY: WhyCopy = {
  heading: "Built for pharma. Not retrofitted for it.",
  sub: "Generic GEO tools track consumer brands. Pharma needs indication-level analysis, label accuracy and MLR-ready output.",
  oldWay: {
    eyebrow: "Generic GEO tools",
    title: "Consumer playbooks, compliance headaches",
    points: ["No indication or label context", "Content your MLR team can't approve", "No route for adverse-event signals"],
  },
  newWay: {
    eyebrow: "With Aeon",
    title: "Pharma-native and approval-ready",
    points: [
      "Indication-level competitive landscape",
      "Every claim linked to the label",
      "Safety signals routed to your PV inbox",
    ],
  },
  cta: "Start your free report",
  micro: "Free first scan. No credit card required.",
};

export function WhySection() {
  const { heading, sub, oldWay, newWay, cta, micro } = WHY_COPY;
  return (
    <section
      data-section="why"
      aria-labelledby="why-heading"
      className="relative z-50 -mt-[60px] rounded-[40px] bg-white px-[20px] pt-[40px] pb-[80px] md:px-[40px] md:pt-[80px]"
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-[40px]">
          <h2
            id="why-heading"
            className="mb-[10px] text-center font-display text-[53px] leading-[1.1] font-medium text-pretty md:leading-[0.9]"
          >
            {heading}
          </h2>
          <p className="text-center text-[18px] leading-[1.5]">{sub}</p>
        </div>

        <div className="grid grid-cols-1 gap-[10px] md:grid-cols-2">
          <WhyCard copy={oldWay} tone="old" visual={<OldWayCollage />} />
          <WhyCard copy={newWay} tone="new" visual={<AeonAppMock />} />
        </div>

        <div className="mt-10">
          <PillButton href={START_HREF} className="mx-auto mb-[4px] flex w-fit px-[24px]">
            {cta}
          </PillButton>
          <p className="mx-auto text-center text-[11px] leading-[1.5] text-stone">{micro}</p>
        </div>
      </div>
    </section>
  );
}

function WhyCard({ copy, tone, visual }: { copy: WhyCardCopy; tone: "old" | "new"; visual: ReactNode }) {
  const isNew = tone === "new";
  const Icon = isNew ? CheckIcon : XIcon;
  return (
    <div
      className={cn(
        "flex flex-col rounded-[20px] p-[20px] md:p-[40px]",
        isNew ? "bg-black text-white" : "bg-sand text-black",
      )}
    >
      <div className="py-[20px]">
        <p className="font-hand text-[28px] leading-[1.5]">{copy.eyebrow}</p>
        <h3 className="mb-[10px] font-display text-[28px] leading-[0.9] font-medium xl:text-[36px]">
          {copy.title}
        </h3>
      </div>
      <ul>
        {copy.points.map((point) => (
          <li key={point} className="flex py-2 text-lg">
            <span className="mt-1 mr-3 shrink-0">
              <Icon
                className={cn("size-5 rounded-full p-1", isNew ? "bg-white text-black" : "bg-black text-white")}
              />
            </span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
      <div className="@container mx-auto mt-auto w-full max-w-[800px] pt-6">{visual}</div>
    </div>
  );
}
