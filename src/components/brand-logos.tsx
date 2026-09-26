import { cn } from "@/lib/utils";

// Third-party logos (AI engines, SEO and pharma tools) shown as "we track / work with" references.
// Files live in /public/logos: `<id>.svg` (brand colour), `<id>-mono.svg` (black) and, where the brand has one,
// `<id>-wordmark.svg`. Sources: LobeHub Icons (MIT) and Simple Icons (CC0); trademarks belong to their owners
// (see third_party/LOGOS.md). Tools without an open logo render a monogram tile instead.

export type BrandId =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "copilot"
  | "grok"
  | "mistral"
  | "metaai"
  | "google"
  | "deepseek"
  | "semrush"
  | "searchconsole"
  | "openevidence"
  | "dailymed"
  | "openfda"
  | "veeva"
  | "ahrefs";

type Brand = {
  name: string;
  /** Brand accent, used for tiles/buttons that need a solid colour. */
  color: string;
  /** Has /logos/<id>.svg and /logos/<id>-mono.svg. */
  logo: boolean;
  /** Has /logos/<id>-wordmark.svg (width:height ratio of its viewBox). */
  wordmarkRatio?: number;
  /** Letters for the monogram fallback. */
  monogram?: string;
};

export const BRANDS: Record<BrandId, Brand> = {
  chatgpt: { name: "ChatGPT", color: "#74AA9C", logo: true },
  claude: { name: "Claude", color: "#D97757", logo: true, wordmarkRatio: 4.04 },
  gemini: { name: "Gemini", color: "#3186FF", logo: true, wordmarkRatio: 4.08 },
  perplexity: { name: "Perplexity", color: "#20808D", logo: true, wordmarkRatio: 4.88 },
  copilot: { name: "Copilot", color: "#0078D4", logo: true, wordmarkRatio: 3.04 },
  grok: { name: "Grok", color: "#000000", logo: true, wordmarkRatio: 2.62 },
  mistral: { name: "Mistral", color: "#FA520F", logo: true, wordmarkRatio: 5.58 },
  metaai: { name: "Meta AI", color: "#0668E1", logo: true, wordmarkRatio: 4.21 },
  google: { name: "Google AI Overviews", color: "#4285F4", logo: true },
  deepseek: { name: "DeepSeek", color: "#4D6BFE", logo: true, wordmarkRatio: 5.46 },
  semrush: { name: "Semrush", color: "#FF642D", logo: true },
  searchconsole: { name: "Search Console", color: "#458CF5", logo: true },
  openevidence: { name: "OpenEvidence", color: "#1F2A44", logo: false, monogram: "OE" },
  dailymed: { name: "DailyMed", color: "#20558A", logo: false, monogram: "DM" },
  openfda: { name: "openFDA", color: "#0071BC", logo: false, monogram: "FDA" },
  veeva: { name: "Veeva PromoMats", color: "#F7931E", logo: false, monogram: "V" },
  ahrefs: { name: "Ahrefs", color: "#054ADA", logo: false, monogram: "a" },
};

type BrandLogoProps = {
  id: BrandId;
  /** color = brand colours, mono = black (tint with CSS filters/opacity), wordmark = icon + name artwork. */
  variant?: "color" | "mono" | "wordmark";
  /** Rendered height in px (width follows the artwork's ratio). */
  size?: number;
  className?: string;
  /** Pass "" when the name is shown next to the logo. */
  alt?: string;
};

export function BrandLogo({ id, variant = "color", size = 24, className, alt }: BrandLogoProps) {
  const brand = BRANDS[id];
  const label = alt ?? brand.name;

  if (!brand.logo) {
    return (
      <span
        role={label ? "img" : undefined}
        aria-label={label || undefined}
        aria-hidden={label ? undefined : true}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-[22%] font-display font-semibold tracking-[-0.02em] text-white",
          className,
        )}
        style={{
          width: size,
          height: size,
          fontSize: Math.round(size * (brand.monogram && brand.monogram.length > 2 ? 0.34 : 0.44)),
          backgroundColor: variant === "mono" ? "#000" : brand.color,
        }}
      >
        {brand.monogram}
      </span>
    );
  }

  const useWordmark = variant === "wordmark" && brand.wordmarkRatio;
  const src = useWordmark ? `/logos/${id}-wordmark.svg` : variant === "mono" ? `/logos/${id}-mono.svg` : `/logos/${id}.svg`;
  const width = useWordmark ? Math.round(size * (brand.wordmarkRatio ?? 1)) : size;

  return (
    // Plain <img>: SVGs aren't run through next/image, and each file keeps its own gradient ids.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={width} height={size} alt={label} className={cn("shrink-0", className)} draggable={false} />
  );
}
