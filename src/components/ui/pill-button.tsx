import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Pill button matching 7shifts' shared button (computed: h 48px, rounded-full, font 16px/24px weight 500,
// px 16px, transition all 150ms cubic-bezier(0.4,0,0.2,1)). Hover colors from the 7shifts token set:
// royal-blue #4570ff -> dark-curacao #3658c9, light-gray #f1f0ec -> medium-gray #e2ded6.
export type PillButtonVariant = "primary" | "secondary" | "outline" | "dark";

const variants: Record<PillButtonVariant, string> = {
  primary: "bg-royal text-white hover:bg-royal-dark active:bg-royal-dark",
  secondary: "bg-sand text-black hover:bg-oat active:bg-oat",
  outline: "border-2 border-solid border-sand bg-transparent text-white hover:bg-sand hover:text-black",
  dark: "bg-black text-white hover:bg-charcoal active:bg-charcoal",
};

const base =
  "inline-flex h-12 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-4 font-display text-[16px] leading-6 font-medium antialiased transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-40";

type PillButtonProps = {
  href?: string;
  variant?: PillButtonVariant;
  className?: string;
  children: ReactNode;
} & Omit<ComponentProps<"button">, "className" | "children">;

export function PillButton({ href, variant = "primary", className, children, ...rest }: PillButtonProps) {
  const classes = cn(base, variants[variant], className);
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}

/** Where every "Start your free report" CTA points until the /start onboarding flow exists. */
export const START_HREF = "/start";
/** Where every "Book a walkthrough" CTA points. */
export const WALKTHROUGH_HREF = "/contact";
