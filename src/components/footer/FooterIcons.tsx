import type { SVGProps } from "react";

// Generic glyphs for the footer. The AI-assistant glyphs sit in brand-coloured 40x40 tiles and are deliberately
// simple shapes, not copies of the assistants' logos. Social icons follow 7shifts' footer icons: a black shape
// whose cut-outs are filled with the footer background (#FBFAF8), so `brightness(0.75)` on hover darkens them.
type IconProps = SVGProps<SVGSVGElement>;

const FOOTER_BG = "#FBFAF8";

// Glyph sizes follow the ink measured on 7shifts' tiles: ~30px, ~29px, 24x26, ~23px and 28x26.

/** Three crossed orbits (ChatGPT tile). */
export function OrbitGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="33" height="33" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="1.4">
        <ellipse cx="12" cy="12" rx="10.3" ry="4.6" />
        <ellipse cx="12" cy="12" rx="10.3" ry="4.6" transform="rotate(60 12 12)" />
        <ellipse cx="12" cy="12" rx="10.3" ry="4.6" transform="rotate(120 12 12)" />
      </g>
    </svg>
  );
}

// Twelve rays, alternating long and short, around an open centre.
const SUNBURST = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * Math.PI) / 6 + Math.PI / 12;
  const outer = i % 2 === 0 ? 11 : 8.2;
  const point = (r: number) => `${(12 + r * Math.cos(angle)).toFixed(2)} ${(12 + r * Math.sin(angle)).toFixed(2)}`;
  return `M${point(2.6)}L${point(outer)}`;
}).join("");

/** Sunburst (Claude tile). */
export function SunburstGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden="true" {...props}>
      <path d={SUNBURST} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Compass: crossed axes through a diamond (Perplexity tile). */
export function CompassGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 2.5v19M2.5 12h19M12 6.3l5.7 5.7-5.7 5.7-5.7-5.7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Four-point sparkle with a blue-to-lavender gradient (Gemini tile). */
export function SparkleGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="aeon-footer-sparkle" x1="2" y1="16" x2="22" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0A7EF9" />
          <stop offset="0.5" stopColor="#1480FA" />
          <stop offset="0.65" stopColor="#4A85FE" />
          <stop offset="0.95" stopColor="#A197E3" />
        </linearGradient>
      </defs>
      <path
        fill="url(#aeon-footer-sparkle)"
        d="M12 1.5c.55 5.6 4.9 9.95 10.5 10.5-5.6.55-9.95 4.9-10.5 10.5-.55-5.6-4.9-9.95-10.5-10.5C7.1 11.45 11.45 7.1 12 1.5Z"
      />
    </svg>
  );
}

/** Slashed circle (Grok tile). */
export function SlashedCircleGlyph(props: IconProps) {
  return (
    <svg viewBox="0 0 28 28" width="28" height="28" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeLinecap="round">
        <circle cx="14" cy="14" r="9" strokeWidth="2.6" />
        <path d="M2 26 26 2" strokeWidth="2.2" />
      </g>
    </svg>
  );
}

/** LinkedIn: "in" in a rounded square (19x19 box, 17px ink like 7shifts' icons). */
export function LinkedInIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 19 19" width="19" height="19" aria-hidden="true" {...props}>
      <rect x="1" y="1" width="17" height="17" rx="2" fill="currentColor" />
      <g fill={FOOTER_BG}>
        <circle cx="5.3" cy="5.4" r="1.45" />
        <rect x="4.05" y="7.6" width="2.5" height="7.6" />
        <path d="M8.4 7.6h2.4v1.1c.4-.7 1.3-1.3 2.6-1.3 2.2 0 2.9 1.4 2.9 3.4v4.4h-2.5v-3.9c0-1-.2-1.8-1.3-1.8s-1.6.8-1.6 1.8v3.9H8.4Z" />
      </g>
    </svg>
  );
}

/** X: a cross in a rounded square (19x19 box). */
export function XSocialIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 19 19" width="19" height="19" aria-hidden="true" {...props}>
      <rect x="1" y="1" width="17" height="17" rx="3" fill="currentColor" />
      <path d="M6.2 6.2l6.6 6.6M12.8 6.2l-6.6 6.6" stroke={FOOTER_BG} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/** YouTube: play triangle in a rounded rectangle (19x14 box, like 7shifts' 18x13 icon). */
export function YouTubeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 19 14" width="19" height="14" aria-hidden="true" {...props}>
      <rect x="0.5" y="0.5" width="18" height="13" rx="3.6" fill="currentColor" />
      <path d="M7.7 4.3v5.4L12.4 7Z" fill={FOOTER_BG} />
    </svg>
  );
}
