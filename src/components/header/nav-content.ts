import { START_HREF, WALKTHROUGH_HREF } from "@/components/ui/pill-button";

// Copy + structure for the site header (announcement bar lives in AnnouncementBar.tsx).
// Mirrors the 7shifts mega-menu anatomy with Aeon content (docs/research/AEON_CONTENT.md, section 2).

export type NavMenuId = "platform" | "built-for";

export type NavItem =
  | { kind: "menu"; id: NavMenuId; label: string; icon: string }
  | { kind: "link"; label: string; href: string; icon: string };

/** Top-level nav, in 7shifts order (Platform, Pricing, Built for, Integrations -> Aeon Index). Research is off until resources return. */
export const NAV_ITEMS: NavItem[] = [
  { kind: "menu", id: "platform", label: "Platform", icon: "/images/doodles/doodle-track.png" },
  { kind: "link", label: "Pricing", href: "/pricing", icon: "/images/doodles/doodle-verify.png" },
  { kind: "menu", id: "built-for", label: "Built for", icon: "/images/doodles/doodle-review.png" },
  { kind: "link", label: "Aeon Index", href: "/aeon-index", icon: "/images/doodles/doodle-measure.png" },
];

/** `shortLabel` replaces the label in the mobile bar below 375px, where the full label would reach the logo. */
export const HEADER_CTA = { label: "Start your free report", shortLabel: "Free report", href: START_HREF } as const;
export const HEADER_SIGN_IN = { label: "Sign in", href: "/login" } as const;

/** Blue bar at the bottom of every desktop panel / black bar under the open mobile menu (7shifts "enterprise" link). */
export const PANEL_FOOTER = {
  lead: "Running a whole portfolio?",
  link: "Book a walkthrough",
  tail: "with our team.",
  href: WALKTHROUGH_HREF,
} as const;
