import Image from "next/image";
import { Apple, FileText } from "lucide-react";

// Rebuild of 7shifts' flattened "old way" collage (a 1080×1080 PNG) as photo + HTML layers.
// Every layer is placed in the PNG's 1080-unit grid: --u = frame width / 1080 (the parent is the @container),
// so the whole collage scales exactly like the image did. Geometry: docs/research/components/WhySection.spec.md.

type CollageCopy = {
  photoAlt: string;
  menuApp: string;
  menuItems: readonly string[];
  toastTitle: string;
  toastBody: string;
  reminder: string;
  chip: string;
};

const COLLAGE: CollageCopy = {
  photoAlt:
    "A cluttered desk: stacks of printed prescribing information marked up with highlighter and red pen, a review binder, sticky notes and a spreadsheet open on a laptop.",
  menuApp: "Finder",
  menuItems: ["File", "Edit", "View", "Go", "Window", "Help"],
  toastTitle: "Prescribing_Info_v7_FINAL.pdf",
  toastBody: "3 new comments",
  reminder: "MLR round 3: 41 comments",
  chip: "Is this claim on-label?",
};

export function OldWayCollage() {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-[calc(var(--u)*41)] [--u:calc(100cqw/1080)]">
      <Image
        src="/images/photos/old-way-desk.webp"
        alt={COLLAGE.photoAlt}
        fill
        sizes="(min-width: 1180px) 465px, (min-width: 810px) calc(50vw - 125px), min(800px, calc(100vw - 80px))"
        className="object-cover"
      />

      <div aria-hidden="true" className="absolute inset-0 font-sans text-black">
        {/* macOS menu bar */}
        <div className="absolute inset-x-0 top-0 flex h-[calc(var(--u)*78)] items-center bg-[#2e3232] pl-[calc(var(--u)*29)] text-[length:calc(var(--u)*18)] leading-none text-white">
          <Apple className="size-[calc(var(--u)*20)] fill-current" strokeWidth={1.5} />
          <span className="ml-[calc(var(--u)*26)] font-bold">{COLLAGE.menuApp}</span>
          {COLLAGE.menuItems.map((item) => (
            <span key={item} className="ml-[calc(var(--u)*22)]">
              {item}
            </span>
          ))}
        </div>

        {/* Notification toast (drawn over the menu bar) */}
        <div className="absolute top-[calc(var(--u)*62)] left-[calc(var(--u)*458)] flex h-[calc(var(--u)*121)] w-[calc(var(--u)*564)] items-center rounded-[calc(var(--u)*20)] bg-[#d9d9d9] pl-[calc(var(--u)*26)]">
          <span className="flex size-[calc(var(--u)*65)] shrink-0 items-center justify-center rounded-[calc(var(--u)*13)] bg-white">
            <FileText className="size-[calc(var(--u)*38)] text-[#e5322d]" strokeWidth={2} />
          </span>
          <span className="ml-[calc(var(--u)*25)] flex flex-col text-[length:calc(var(--u)*22)] leading-[calc(var(--u)*34)]">
            <span className="font-semibold">{COLLAGE.toastTitle}</span>
            <span>{COLLAGE.toastBody}</span>
          </span>
        </div>

        {/* Arrow cursor resting on the toast: tip at (760,158), tilted 16° like the original */}
        <svg
          viewBox="740 140 80 80"
          className="absolute top-[calc(var(--u)*140)] left-[calc(var(--u)*740)] size-[calc(var(--u)*80)]"
        >
          <path
            transform="translate(760 158) rotate(-16)"
            d="M0 0V37.6L8.5 29.1L15.5 45.5L20.1 44.4L14.5 31.4H31.4Z"
            fill="#fff"
            stroke="#000"
            strokeWidth={2.6}
            strokeLinejoin="round"
          />
        </svg>

        {/* Royal-blue reminder, bleeding off the right edge */}
        <div className="absolute top-[calc(var(--u)*237)] left-[calc(var(--u)*644)] flex h-[calc(var(--u)*93)] w-[calc(var(--u)*470)] items-center rounded-[calc(var(--u)*20)] bg-royal pl-[calc(var(--u)*31)] text-[length:calc(var(--u)*22)] leading-none text-white">
          {COLLAGE.reminder}
        </div>

        {/* Chat chip, square bottom-left corner */}
        <div className="absolute top-[calc(var(--u)*903)] left-[calc(var(--u)*47)] flex h-[calc(var(--u)*80)] items-center rounded-[calc(var(--u)*20)] rounded-bl-none bg-white pr-[calc(var(--u)*69)] pl-[calc(var(--u)*41)] text-[length:calc(var(--u)*22)] leading-none whitespace-nowrap">
          {COLLAGE.chip}
        </div>
      </div>
    </div>
  );
}
