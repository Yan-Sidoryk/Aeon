import Link from "next/link";
import { ArrowThinIcon } from "@/components/icons";

// 7shifts `#top-banner`: fixed black bar, 37px tall, whole bar is one link.
const ANNOUNCEMENT = {
  badge: "New:",
  text: "AI pre-MLR review is now in Aeon. Drafts arrive claim-referenced and approval-ready.",
  shortText: "AI pre-MLR review is now in Aeon.",
  href: "#platform",
} as const;

export function AnnouncementBar() {
  return (
    <div data-section="announcement" className="fixed inset-x-0 top-0 z-[110] h-[37px] w-full bg-black">
      <Link
        href={ANNOUNCEMENT.href}
        className="flex h-full items-center justify-center gap-1.5 px-3 font-display text-[13px] leading-[1.2] font-medium whitespace-nowrap text-white transition-opacity duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-inset sm:gap-2 sm:px-5 sm:text-[14px]"
      >
        <span className="shrink-0 font-hand text-[15px] text-lime sm:text-[16px]">{ANNOUNCEMENT.badge}</span>
        <span className="min-w-0 truncate">
          <span className="md:hidden">{ANNOUNCEMENT.shortText}</span>
          <span className="hidden md:inline">{ANNOUNCEMENT.text}</span>
        </span>
        <ArrowThinIcon className="shrink-0" />
      </Link>
    </div>
  );
}
