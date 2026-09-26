import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { ArrowSmallIcon } from "./icons";
import { BUILT_FOR_ITEMS, PLATFORM_COLUMNS, RESEARCH_CARDS, RESEARCH_FEATURE, RESEARCH_ITEMS } from "./panel-content";

// Accordion bodies of the mobile / tablet menu (< 1200px), matching the 7shifts max-xl markup.

const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-royal";

export function MobilePlatformPanel() {
  return (
    <div className="px-4">
      <div className="flex flex-col items-start pt-[5px] pb-10 pl-2.5">
        {PLATFORM_COLUMNS.map((column) => (
          <Fragment key={column.title}>
            <Link
              href={column.href}
              className={cn("flex items-center self-stretch rounded-[4px] border-b border-sand p-2.5", FOCUS, column.colorClass)}
            >
              <span className="flex-1 font-display text-[18px] leading-none font-medium tracking-[-0.18px]">{column.title}</span>
            </Link>
            <ul className="flex flex-col gap-[5px] self-stretch">
              {column.links.map(({ label, href, icon: Icon }) => (
                <li key={label} className="py-[5px]">
                  <Link href={href} className={cn("flex w-full items-center gap-2.5 bg-white", FOCUS)}>
                    <span className="flex size-[30px] shrink-0 items-center justify-center">
                      <Icon className="size-6" strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="flex-1 font-display text-[16px] leading-6">{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function MobileBuiltForPanel() {
  return (
    <div className="px-4">
      <ul className="flex flex-col pb-10">
        {BUILT_FOR_ITEMS.map((item) => (
          <li key={item.title}>
            <Link
              href={item.href}
              className={cn(
                "flex items-start gap-2.5 rounded-2xl bg-white px-5 py-2.5 shadow-[0_1px_5px_rgba(0,0,0,0.1)] hover:bg-sand",
                FOCUS,
              )}
            >
              <Image src={item.icon} alt="" width={22} height={22} className="size-[22px] shrink-0 object-contain" />
              <span className="font-display text-[16px] leading-6">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MobileResearchPanel() {
  return (
    <div className="px-4">
      <ul className="flex flex-col pb-10">
        {RESEARCH_CARDS.map((card) => (
          <li key={card.title}>
            <Link href={card.href} className={cn("block rounded-2xl bg-white py-5 pl-4 hover:bg-sand", FOCUS)}>
              <Image src={card.icon} alt="" width={60} height={60} className="mb-2 size-[60px] object-contain" />
              <span className="flex flex-col gap-2">
                <span className="font-display text-[20px] leading-7 font-medium">{card.title}</span>
                <span className="pr-10 font-display text-[14px] leading-4 font-medium">{card.description}</span>
              </span>
            </Link>
          </li>
        ))}
        {RESEARCH_ITEMS.map((item) => (
          <li key={item.title}>
            <Link href={item.href} className={cn("flex items-start gap-4 bg-white py-5 pl-4 hover:bg-sand", FOCUS)}>
              <Image src={item.icon} alt="" width={60} height={60} className="size-[60px] shrink-0 object-contain" />
              <span className="flex min-w-0 flex-col gap-2">
                <span className="font-display text-[20px] leading-7 font-medium">{item.title}</span>
                <span className="pr-10 font-display text-[14px] leading-4 font-medium">{item.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="pb-10">
        <Link href={RESEARCH_FEATURE.href} className={cn("flex flex-col gap-4 rounded-2xl", FOCUS)}>
          <span className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-black">
            <Image src={RESEARCH_FEATURE.image} alt="" fill sizes="calc(100vw - 32px)" className="object-cover" />
          </span>
          <span className="flex flex-col gap-3">
            <span className="mr-auto rounded-full bg-lavender px-2 py-0.5 font-sans text-[10px] leading-[1.5]">
              {RESEARCH_FEATURE.tag}
            </span>
            <span className="font-display text-[20px] leading-7 font-medium">{RESEARCH_FEATURE.title}</span>
            <span className="flex items-center gap-1 font-display text-[14px] leading-5 font-medium">
              {RESEARCH_FEATURE.link}
              <ArrowSmallIcon className="size-3" />
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}
