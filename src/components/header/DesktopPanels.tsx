import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ArrowSmallIcon } from "./icons";
import { PANEL_FOOTER } from "./nav-content";
import {
  BUILT_FOR_ITEMS,
  BUILT_FOR_TITLE,
  PLATFORM_COLUMNS,
  PLATFORM_TITLE,
  RESEARCH_CARDS,
  RESEARCH_FEATURE,
  RESEARCH_ITEMS,
  RESEARCH_TITLE,
} from "./panel-content";

// Desktop (>= 1200px) mega-menu panels. Geometry is the computed 7shifts panel card:
// white, radius 40px, shadow 0 4px 15px rgba(0,0,0,.1), padding 20px 16px, royal footer bar clipped by the card.

const CARD = "relative overflow-hidden rounded-[40px] bg-white px-4 pt-5 text-black shadow-[0_4px_15px_0_rgba(0,0,0,0.10)]";
const TITLE = "text-center font-display text-[28px] leading-[1.15] font-medium text-black";
/** Link row: hover/focus paints the 7shifts light-gray and reveals the arrow (no transition, like 7shifts). */
const ROW = "group/row flex rounded-[10px] px-2.5 py-1.5 outline-none hover:bg-sand focus-visible:bg-sand focus-visible:ring-2 focus-visible:ring-royal";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 focus-visible:ring-offset-white";

function RowArrow() {
  return (
    <ArrowRightIcon
      className="ml-auto size-4 shrink-0 self-center opacity-0 group-hover/row:opacity-100 group-focus-visible/row:opacity-100"
      aria-hidden="true"
    />
  );
}

function PanelFooter() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[45px] bg-royal pt-2.5 text-center">
      <Link
        href={PANEL_FOOTER.href}
        className="rounded-[10px] font-display text-[16px] leading-6 font-medium text-white hover:underline focus-visible:underline focus-visible:outline-none"
      >
        {PANEL_FOOTER.lead} {PANEL_FOOTER.link} {PANEL_FOOTER.tail}
      </Link>
    </div>
  );
}

export function PlatformPanel() {
  return (
    <div className={cn(CARD, "pb-[70px]")}>
      <p className={TITLE}>{PLATFORM_TITLE}</p>
      <div className="mt-10 grid grid-cols-5 gap-x-6 gap-y-3.5">
        {PLATFORM_COLUMNS.map((column) => (
          <div key={column.title} className="flex min-w-0 flex-col">
            <Link
              href={column.href}
              className={cn(
                "mb-1.5 flex flex-col items-center justify-center gap-1 rounded-[10px] px-3 pt-4 pb-5 text-center shadow-[0_1px_5px_rgba(0,0,0,0.1)] hover:bg-white focus-visible:bg-white",
                FOCUS,
                column.colorClass,
              )}
            >
              <span className="font-hand text-[28px] leading-7 tracking-[-0.84px]">{column.title}</span>
              <span className="font-display text-[14px] leading-5 font-medium">{column.description}</span>
            </Link>
            <ul className="flex flex-col pt-2.5">
              {column.links.map(({ label, href, icon: Icon }) => (
                <li key={label}>
                  <Link href={href} className={cn(ROW, "items-center gap-2.5")}>
                    <span className="flex size-7 shrink-0 items-center justify-center">
                      <Icon className="size-[22px]" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 font-display text-[14px] leading-5 font-medium">{label}</span>
                    <RowArrow />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <PanelFooter />
    </div>
  );
}

export function BuiltForPanel() {
  return (
    <div className={cn(CARD, "pb-16")}>
      <p className={TITLE}>{BUILT_FOR_TITLE}</p>
      <ul className="mt-5 grid grid-cols-3 gap-x-6 gap-y-3.5">
        {BUILT_FOR_ITEMS.map((item) => (
          <li key={item.title} className="flex">
            <Link href={item.href} className={cn(ROW, "w-full items-start gap-4")}>
              <Image src={item.icon} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
              <span className="flex min-w-0 flex-col gap-2.5">
                <span className="font-display text-[20px] leading-5 font-medium">{item.title}</span>
                <span className="font-display text-[14px] leading-5 font-medium">{item.description}</span>
              </span>
              <RowArrow />
            </Link>
          </li>
        ))}
      </ul>
      <PanelFooter />
    </div>
  );
}

export function ResearchPanel() {
  return (
    <div className={cn(CARD, "grid grid-cols-12 gap-x-6 gap-y-3.5 pb-[70px]")}>
      <p className={cn(TITLE, "col-span-12 mb-5")}>{RESEARCH_TITLE}</p>
      <ul className="col-span-8 grid grid-cols-2 content-start gap-x-6 gap-y-3.5">
        {RESEARCH_ITEMS.map((item) => (
          <li key={item.title} className="flex">
            <Link href={item.href} className={cn(ROW, "w-full items-start gap-4")}>
              <Image src={item.icon} alt="" width={36} height={36} className="size-9 shrink-0 object-contain" />
              <span className="flex min-w-0 flex-col gap-2.5">
                <span className="font-display text-[20px] leading-7 font-medium">{item.title}</span>
                <span className="font-display text-[14px] leading-4 font-medium">{item.description}</span>
              </span>
              <RowArrow />
            </Link>
          </li>
        ))}
        {RESEARCH_CARDS.map((card) => (
          <li key={card.title} className="flex">
            <Link
              href={card.href}
              className={cn(
                "block w-full rounded-2xl p-5 shadow-[0_1px_5px_rgba(0,0,0,0.1)] hover:bg-white focus-visible:bg-white",
                FOCUS,
                card.colorClass,
              )}
            >
              <Image src={card.icon} alt="" width={56} height={56} className="mb-2 size-14 object-contain" />
              <span className="flex flex-col gap-2.5">
                <span className="font-display text-[20px] leading-7 font-medium">{card.title}</span>
                <span className="font-display text-[14px] leading-4 font-medium">{card.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="col-span-4 flex flex-col px-1 pt-2">
        <Link href={RESEARCH_FEATURE.href} className={cn("group/feat flex flex-1 flex-col gap-4 rounded-[10px]", FOCUS)}>
          <span className="relative block min-h-[200px] flex-1 overflow-hidden rounded-2xl bg-black">
            <Image
              src={RESEARCH_FEATURE.image}
              alt=""
              fill
              sizes="(min-width: 1200px) 28vw, 100vw"
              className="object-cover"
            />
          </span>
          <span className="flex flex-col gap-3">
            <span className="mr-auto rounded-full bg-lavender px-3 py-1 font-sans text-[14px] leading-5">
              {RESEARCH_FEATURE.tag}
            </span>
            <span className="font-display text-[20px] leading-7 font-medium">{RESEARCH_FEATURE.title}</span>
            <span className="font-sans text-[14px] leading-5">{RESEARCH_FEATURE.description}</span>
            <span className="flex items-center gap-1 font-display text-[14px] leading-5 font-medium underline-offset-[3px] group-hover/feat:underline">
              {RESEARCH_FEATURE.link}
              <ArrowSmallIcon className="size-3" />
            </span>
          </span>
        </Link>
      </div>
      <PanelFooter />
    </div>
  );
}
