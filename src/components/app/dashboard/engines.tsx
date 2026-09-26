import { BrandLogo, type BrandId } from "@/components/brand-logos";
import { engineLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Report } from "@/types/api";

// Engine ids the backend uses → the logo files in /public/logos.
const BRAND: Record<string, BrandId> = {
  claude: "claude",
  chatgpt: "chatgpt",
  gemini: "gemini",
  perplexity: "perplexity",
  google_aio: "google",
  google_ai_mode: "google",
  ai_overviews: "google",
};

const SHORT: Record<string, string> = { google_aio: "AI Overviews", google_ai_mode: "AI Mode" };

/** Column-width name: "AI Overviews" (the Google mark sits next to it). */
export function shortEngineLabel(name: string, label?: string): string {
  return SHORT[name] ?? (label ?? engineLabel(name)).replace(/^Google /, "");
}

/** Full engine name from the report's own labels, falling back to the static map. */
export function reportEngineLabel(report: Pick<Report, "engines" | "coming_soon">, name: string): string {
  return [...report.engines, ...report.coming_soon].find((e) => e.name === name)?.label ?? engineLabel(name);
}

type EngineMarkProps = { engine: string; size?: number; muted?: boolean; className?: string };

/** The engine's logo, decorative (its name is always printed next to it). */
export function EngineMark({ engine, size = 18, muted = false, className }: EngineMarkProps) {
  const id = BRAND[engine];
  if (!id) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "grid size-[18px] shrink-0 place-items-center rounded-full bg-sand text-[10px] font-semibold text-graphite",
          className
        )}
      >
        {engine.charAt(0).toUpperCase()}
      </span>
    );
  }
  return <BrandLogo id={id} variant={muted ? "mono" : "color"} size={size} alt="" className={cn(muted && "opacity-35", className)} />;
}
