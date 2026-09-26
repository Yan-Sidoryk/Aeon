import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { BUILT_FOR_ITEMS, PLATFORM_COLUMNS } from "./panel-content";

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
