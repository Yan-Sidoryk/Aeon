import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { AeonLogo } from "@/components/AeonLogo";
import { BrandLogo, type BrandId } from "@/components/brand-logos";
import {
  LinkedInIcon,
  XSocialIcon,
  YouTubeIcon,
} from "@/components/footer/FooterIcons";
import { WALKTHROUGH_HREF } from "@/components/ui/pill-button";
import { cn } from "@/lib/utils";

// Site footer, reproducing 7shifts' footer anatomy (spec: docs/research/components/SiteFooter.spec.md).
// 7shifts' breakpoints are md 810 / lg 1024; its `max-md:` / `md:` variants appear here as the equivalent
// `max-[810px]:` / `min-[810px]:`. Radii are explicit px values measured from 7shifts.

type FooterLinkItem = { label: string; href: string };

type FooterColumn = {
  id: string;
  title: string;
  links: FooterLinkItem[];
  /** Spans two grid tracks with a two-up list, like 7shifts' "Products" column. */
  wide?: boolean;
  /** Every row as tall as the tallest item (`auto-rows-fr`), like 7shifts' first three lists. */
  equalRows?: boolean;
};

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

type Assistant = { name: string; href: string; tileClassName: string; logo: BrandId; logoVariant: "color" | "mono"; logoClassName?: string };

type SocialLink = { label: string; href: string; Icon: IconComponent };

const HEADLINE = "AI Visibility for Pharma";

const toLinks = (labels: string[], href: string): FooterLinkItem[] => labels.map((label) => ({ label, href }));

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    id: "platform",
    title: "Platform",
    wide: true,
    equalRows: true,
    links: toLinks(
      [
        "AI visibility tracking",
        "Accuracy vs. label",
        "Content fixes",
        "AI pre-MLR review",
        "Technical SEO audit",
        "Citation map",
        "Recommendations",
      ],
      "#platform",
    ),
  },
  {
    id: "company",
    title: "Company",
    equalRows: true,
    links: [
      { label: "About", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Security", href: "/security" },
      { label: "Pricing", href: "/pricing" },
      { label: "Book a walkthrough", href: WALKTHROUGH_HREF },
    ],
  },
  {
    id: "built-for",
    title: "Built for",
    links: toLinks(
      [
        "Brand & digital marketing",
        "Medical affairs",
        "Regulatory & MLR",
        "Pharmacovigilance",
        "Agencies",
        "Rx brands",
        "OTC & consumer health",
        "Biotech",
      ],
      "#personas",
    ),
  },
  {
    id: "support",
    title: "Support",
    links: [
      { label: "Help center", href: "/help-center" },
      { label: "Contact sales", href: "/contact-sales" },
      { label: "System status", href: "/system-status" },
    ],
  },
];

const ASK_AI_HEADING = "Ask AI for a summary of Aeon";
const ASK_AI_PROMPT = encodeURIComponent(
  "Summarize what Aeon (AI visibility and pre-MLR platform for pharma brands) does and who it is for.",
);

// Tile colours sampled from 7shifts' assistant tiles; logos from /public/logos (white on colour, Gemini in colour on white).
const ASSISTANTS: Assistant[] = [
  {
    name: "ChatGPT",
    href: `https://chatgpt.com/?q=${ASK_AI_PROMPT}`,
    tileClassName: "bg-[#74AB9B] text-[#FAFEFF]",
    logo: "chatgpt",
    logoVariant: "mono",
    logoClassName: "brightness-0 invert",
  },
  {
    name: "Claude",
    href: `https://claude.ai/new?q=${ASK_AI_PROMPT}`,
    tileClassName: "bg-[#D67657] text-[#FFFDF1]",
    logo: "claude",
    logoVariant: "mono",
    logoClassName: "brightness-0 invert",
  },
  {
    name: "Perplexity",
    href: `https://www.perplexity.ai/search?q=${ASK_AI_PROMPT}`,
    tileClassName: "bg-[#1F1F1F] text-white",
    logo: "perplexity",
    logoVariant: "mono",
    logoClassName: "brightness-0 invert",
  },
  {
    name: "Gemini",
    href: `https://www.google.com/search?udm=50&aep=11&q=${ASK_AI_PROMPT}`,
    tileClassName: "bg-white shadow-[inset_-1px_-1px_0_#EBEAE9]",
    logo: "gemini",
    logoVariant: "color",
  },
  {
    name: "Grok",
    href: `https://x.com/i/grok?text=${ASK_AI_PROMPT}`,
    tileClassName: "bg-black text-white",
    logo: "grok",
    logoVariant: "mono",
    logoClassName: "brightness-0 invert",
  },
];

const SOCIAL_LINKS: SocialLink[] = [
  { label: "Aeon on LinkedIn", href: "#", Icon: LinkedInIcon },
  { label: "Aeon on X", href: "#", Icon: XSocialIcon },
  { label: "Aeon on YouTube", href: "#", Icon: YouTubeIcon },
];

const COPYRIGHT = "Aeon © 2026";

const LEGAL_LINKS: FooterLinkItem[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "DPA", href: "/dpa" },
  { label: "Security", href: "/security" },
  { label: "Cookie preferences", href: "/cookie-preferences" },
];

// 7shifts' global focus style: 1px solid dark-curacao outline, 2px offset.
const FOCUS_RING = "focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-royal-dark";

type FooterLinkProps = {
  href: string;
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
};

/** External URLs open in a new tab; everything else (paths, on-page anchors, placeholders) goes through next/link. */
function FooterLink({ href, className, children, ...rest }: FooterLinkProps) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

export function SiteFooter() {
  return (
    <footer data-section="footer" className="relative z-50 rounded-t-[40px] bg-offwhite">
      <div className="px-5 pt-9 pb-5 lg:px-10">
        <div className="m-auto flex max-w-[1120px] flex-col gap-10">
          {/* Headline row: category line left, logo mark right (stacked, logo first, below 810px). */}
          <div className="mx-auto flex w-full max-w-[1020px] justify-between border-b-2 border-gray-300 pb-5 max-[810px]:flex-col-reverse max-[810px]:gap-y-5">
            <div className="flex flex-col justify-center">
              <h2 className="font-display text-[40px] leading-[90%] font-medium max-[810px]:text-[28px]">
                {HEADLINE}
              </h2>
            </div>
            <div className="flex flex-col justify-center">
              <AeonLogo variant="mark" className="w-[38px]" />
            </div>
          </div>

          {/* Link columns: 120px tracks centred from lg, 100px tracks from the left below it. */}
          <div className="relative grid grid-cols-[repeat(auto-fill,100px)] justify-start gap-[60px] lg:grid-cols-[repeat(auto-fill,120px)] lg:justify-center">
            {FOOTER_COLUMNS.map((column) => {
              const headingId = `footer-${column.id}-heading`;
              return (
                <nav
                  key={column.id}
                  aria-labelledby={headingId}
                  className={cn("flex w-full flex-col gap-6 text-sm leading-4", column.wide && "col-span-2")}
                >
                  <h2 id={headingId} className="font-bold tracking-wide antialiased">
                    {column.title}
                  </h2>
                  <ul
                    className={cn(
                      "grid gap-5 tracking-tight",
                      column.wide ? "grid-cols-[repeat(2,120px)]" : "grid-cols-[repeat(1,minmax(120px,1fr))]",
                      column.equalRows && "auto-rows-fr",
                    )}
                  >
                    {column.links.map((link) => (
                      <li key={link.label} className="leading-[14px] hover:underline">
                        <FooterLink href={link.href} className={FOCUS_RING}>
                          {link.label}
                        </FooterLink>
                      </li>
                    ))}
                  </ul>
                </nav>
              );
            })}
          </div>

          {/* Ask AI row */}
          <div className="border-t border-gray-300 pt-5">
            <div className="flex flex-col gap-4">
              <h3 className="font-display text-sm font-medium text-gray-700">{ASK_AI_HEADING}</h3>
              <div className="flex items-center gap-4">
                {ASSISTANTS.map(({ name, href, tileClassName, logo, logoVariant, logoClassName }) => (
                  <FooterLink
                    key={name}
                    href={href}
                    aria-label={`Ask ${name} about Aeon`}
                    className={cn("block size-10 transition-opacity hover:opacity-70", FOCUS_RING)}
                  >
                    <span className={cn("flex size-10 items-center justify-center rounded-[8px]", tileClassName)}>
                      <BrandLogo id={logo} variant={logoVariant} size={22} alt="" className={logoClassName} />
                    </span>
                  </FooterLink>
                ))}
              </div>
            </div>
          </div>

          {/* Social icons: each icon sits on a 16px/24px text line, as on 7shifts. */}
          <nav aria-label="Aeon on social media">
            <ul className="flex items-center justify-end gap-4">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <FooterLink
                    href={href}
                    aria-label={label}
                    className={cn("inline-flex rounded-[4px] text-black hover:brightness-75", FOCUS_RING)}
                  >
                    <Icon className="block" />
                  </FooterLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Legal bar */}
      <div className="flex flex-col bg-black px-10 py-5 text-xs lg:flex-row lg:justify-between">
        <div className="m-auto flex w-full max-w-[1120px] flex-col justify-between gap-5 tracking-tighter antialiased lg:flex-row">
          <div className="flex items-center gap-2.5">
            <p className="whitespace-nowrap text-white">{COPYRIGHT}</p>
          </div>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-5 text-sand min-[810px]:justify-end">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label} className="whitespace-nowrap">
                  <FooterLink href={link.href} className={cn("flex gap-1 hover:underline", FOCUS_RING)}>
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
