"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AeonLogo } from "@/components/AeonLogo";
import { PillButton, START_HREF } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";

// The six onboarding screens from docs/user-journey-pharma-onboarding.md.
const STEPS = [
  { path: "/start", label: "Website" },
  { path: "/start/portfolio", label: "Portfolio" },
  { path: "/start/hero", label: "Hero drug" },
  { path: "/start/setup", label: "Setup" },
  { path: "/start/scan", label: "Scan" },
] as const;

const FOCUS = "rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-royal";

export function AppHeader() {
  const pathname = usePathname();
  const onReport = pathname.startsWith("/report");
  const current = Math.max(0, STEPS.findIndex((s) => s.path === pathname));

  return (
    <header className="sticky top-0 z-50 border-b border-oat/70 bg-white/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-6 px-4 md:px-8">
        <Link href="/" aria-label="Aeon home" className={FOCUS}>
          <AeonLogo className="w-[84px]" />
        </Link>

        {onReport ? (
          <PillButton href={START_HREF} variant="secondary" className="h-10 px-4 text-[14px]">
            New report
          </PillButton>
        ) : (
          <>
            <ol aria-label="Onboarding steps" className="hidden items-center gap-2 md:flex">
              {STEPS.map((step, i) => (
                <li key={step.path} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden="true" className={cn("h-px w-5", i <= current ? "bg-royal" : "bg-oat")} />}
                  <span
                    aria-current={i === current ? "step" : undefined}
                    className={cn(
                      "flex items-center gap-1.5 text-[13px] leading-none font-medium",
                      i === current ? "text-black" : i < current ? "text-stone" : "text-taupe"
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full text-[11px]",
                        i < current && "bg-lime text-forest",
                        i === current && "bg-royal text-white",
                        i > current && "bg-sand text-taupe"
                      )}
                    >
                      {i < current ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                    </span>
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-[13px] font-medium text-stone md:hidden">
              Step {current + 1} of {STEPS.length} · {STEPS[current].label}
            </p>
          </>
        )}
      </div>
    </header>
  );
}
