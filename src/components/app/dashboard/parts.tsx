"use client";

import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Report } from "@/types/api";
import { Panel, Skeleton } from "../ui";
import { useDashboard } from "./context";
import { RunScanButton } from "./RunScan";

/** Title row of a dashboard page: what the page answers, plus its actions. */
export function PageHeading({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[24px] leading-[1.1] font-medium tracking-[-0.02em] md:text-[28px]">{title}</h2>
        {description && <p className="mt-2 max-w-[640px] text-[15px] leading-[1.5] text-stone">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Heading inside a panel. */
export function PanelTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("font-display text-[18px] leading-[1.2] font-medium tracking-[-0.01em]", className)}>{children}</h3>;
}

/** "See all questions →" style link. External links open in a new tab with ↗. */
export function ArrowLink({
  href,
  children,
  external = false,
  className,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  className?: string;
}) {
  const classes = cn(
    "group inline-flex items-center gap-1 text-[14px] font-medium text-royal-dark underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal",
    className
  );
  const Icon = external ? ArrowUpRight : ArrowRight;
  const icon = <Icon className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} aria-hidden="true" />;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        {icon}
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
      {icon}
    </Link>
  );
}

/** Loading placeholder for a page body. */
function PageSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full max-w-[480px]" />
      <Skeleton className="mt-4 h-64 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
    </div>
  );
}

/**
 * Shown on pages that read the latest report before the drug's first scan has finished. A drug that was never set up
 * has no questions yet, and a scan would be refused, so the button points to setup instead.
 */
export function NoScanYet() {
  const { product, runningScan, needsSetup } = useDashboard();
  const brand = product?.brand ?? "this drug";

  return (
    <Panel className="flex flex-col items-start gap-5 p-6 md:p-10">
      <p className="font-hand text-[26px] leading-none">Nothing to show yet</p>
      <div>
        <p className="font-display text-[26px] leading-[1.15] font-medium tracking-[-0.02em] text-balance md:text-[32px]">
          {runningScan
            ? `The first scan of ${brand} is running`
            : needsSetup
              ? `${brand} isn't set up yet`
              : `${brand} hasn't been scanned yet`}
        </p>
        <p className="mt-3 max-w-[560px] text-[16px] leading-[1.55] text-stone">
          {needsSetup
            ? `Pick ${brand} as the drug to track and we propose its competitors and the questions to ask AI. Then the first scan runs.`
            : `A scan asks AI your questions about ${brand} on every live engine and checks each answer against the FDA label. It takes about 3 minutes.`}
        </p>
      </div>
      {needsSetup === undefined ? (
        <Skeleton className="h-11 w-48 rounded-full" />
      ) : (
        <RunScanButton label="Run the first scan" variant="primary" className="sm:items-start" />
      )}
    </Panel>
  );
}

/** Renders the page once the latest report is in; a skeleton before, an empty state when there's no scan. */
export function WithReport({ children }: { children: (report: Report) => ReactNode }) {
  const { report } = useDashboard();
  if (report === undefined) return <PageSkeleton />;
  if (report === null) return <NoScanYet />;
  return <>{children(report)}</>;
}

/** Big count, e.g. "4 of 6". */
export function CountOf({
  value,
  of,
  tone = "royal",
  className,
}: {
  value: number;
  of: number;
  tone?: "royal" | "ink" | "alert";
  className?: string;
}) {
  return (
    <span className={cn("font-display leading-none font-medium tracking-[-0.02em] tabular-nums", className)}>
      <span className={cn(tone === "royal" && "text-royal-dark", tone === "alert" && "text-alert-ink")}>{value}</span>
      <span className="text-[0.55em] font-normal tracking-normal text-taupe"> of {of}</span>
    </span>
  );
}
