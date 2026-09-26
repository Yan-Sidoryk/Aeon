import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRightIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import styles from "./resources.module.css";

type ArrowLinkProps = {
  href: string;
  children: ReactNode;
  /** Visually hidden context appended to the accessible name (e.g. the card title). */
  srContext?: string;
  className?: string;
};

/**
 * 7shifts "View more →" text link: 16px/24px medium label, 16px arrow 12px to the right that nudges 2px on hover,
 * and a 1px black underline that grows from the left across the whole link in 300ms.
 */
export function ArrowLink({ href, children, srContext, className }: ArrowLinkProps) {
  return (
    <Link href={href} className={cn("group relative flex w-fit cursor-pointer align-middle", styles.link, className)}>
      <span className="block font-display text-[16px] leading-6 font-medium whitespace-nowrap">
        {children}
        {srContext ? <span className="sr-only">: {srContext}</span> : null}
      </span>
      <ArrowRightIcon className={cn("my-auto ml-3 shrink-0 transition-all duration-700", styles.arrow)} />
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-black transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
    </Link>
  );
}
