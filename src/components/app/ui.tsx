import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Product UI atoms. Palette and shapes follow the platform mocks (src/components/platform/mocks): white cards on
// off-white, royal for "you", stone for competitors, lime for passes, alert red for label conflicts.

/**
 * tailwind-merge treats a text size and a line-height as conflicting, so a caller overriding an atom's size (e.g.
 * text-[30px]) would silently drop the atom's leading. Apply the leading last, unless the caller sets its own.
 */
function withLeading(base: string, leading: string, className?: string): string {
  return cn(base, className, /(^|\s)(\w+:)*leading-/.test(className ?? "") ? undefined : leading);
}

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1040px] px-4 pt-10 pb-36 md:px-8 md:pt-16", className)}>{children}</div>;
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={withLeading("font-hand text-[26px] text-black", "leading-none", className)}>{children}</p>;
}

export function PageTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1
      className={withLeading(
        "mt-2 font-display text-[34px] font-medium tracking-[-0.03em] text-balance md:text-[48px]",
        "leading-[1.05]",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function Lead({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={withLeading("mt-4 max-w-[640px] text-[16px] text-stone md:text-[18px]", "leading-[1.55]", className)}>
      {children}
    </p>
  );
}

export function SectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2
      className={withLeading("font-display text-[22px] font-medium tracking-[-0.02em] md:text-[26px]", "leading-[1.15]", className)}
    >
      {children}
    </h2>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-oat/70 bg-white p-5 md:p-6", className)}>{children}</div>;
}

export type Tone = "royal" | "lime" | "sand" | "alert" | "lavender" | "periwinkle" | "flame" | "white";

const TONES: Record<Tone, string> = {
  royal: "bg-royal/12 text-royal-dark",
  lime: "bg-lime text-forest",
  sand: "bg-sand text-graphite",
  alert: "bg-alert-soft text-alert-ink",
  lavender: "bg-lavender text-eggplant",
  periwinkle: "bg-periwinkle text-navy",
  flame: "bg-flame/12 text-[#a84300]",
  white: "border border-oat bg-white text-graphite",
};

export function Badge({ tone = "sand", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span
      className={withLeading(
        cn("inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-[12px] font-medium whitespace-nowrap", TONES[tone]),
        "leading-none",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-royal border-t-transparent", className)}
    />
  );
}

export function ErrorNote({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-alert-line bg-alert-soft px-5 py-4 text-[15px] leading-[1.45] text-alert-ink sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p>{children}</p>
      {action}
    </div>
  );
}

/** Loading placeholder that keeps the layout from jumping. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-xl bg-sand", className)} />;
}

export const inputClass =
  "h-12 w-full min-w-0 rounded-full border border-oat bg-white px-5 text-[16px] outline-none transition-colors placeholder:text-taupe focus:border-royal focus:ring-2 focus:ring-royal/20 disabled:opacity-60";

/** Sticky bottom bar that holds a screen's one primary button. */
export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-oat/70 bg-white/92 backdrop-blur-md">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1040px] items-center justify-between gap-4 px-4 py-3 md:px-8",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
