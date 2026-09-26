import type { SVGProps } from "react";

// Social icons for the footer. They follow 7shifts' footer icons: a black shape whose cut-outs are filled with
// the footer background (#FBFAF8), so `brightness(0.75)` on hover darkens them. (AI-assistant tiles use the real
// logos from /public/logos via BrandLogo.)
type IconProps = SVGProps<SVGSVGElement>;

const FOOTER_BG = "#FBFAF8";

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
