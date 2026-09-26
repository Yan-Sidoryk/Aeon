import type { Metadata } from "next";
import { Geist, Inter_Tight, Nanum_Pen_Script } from "next/font/google";
import "./globals.css";

// Display face for headings (stands in for 7shifts' proprietary "7sans" medium).
const display = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Body face — same family 7shifts uses for body copy.
const body = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

// Handwritten eyebrow face — same family 7shifts uses.
const hand = Nanum_Pen_Script({
  variable: "--font-nanum-pen",
  subsets: ["latin"],
  weight: "400",
});

// Absolute base for OG/Twitter image URLs. Set NEXT_PUBLIC_SITE_URL once the domain is live; without it,
// Next.js falls back to the Vercel deployment URL (or localhost in local builds).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: "Aeon: AI Visibility & GEO for Pharma Brands (ChatGPT, Claude, Gemini, Perplexity)",
  description:
    "Aeon shows pharma brands how ChatGPT, Claude, Gemini and Perplexity talk about their drugs, checks every answer against the label, and turns the gaps into MLR-ready fixes.",
  openGraph: {
    title: "Aeon: See how AI actually talks about your pharma brand",
    description:
      "AI visibility, accuracy checks against the label, and AI pre-MLR review in one loop. Your first report in about 5 minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${hand.variable} antialiased`}>
      <body className="min-h-full bg-white font-sans text-black">{children}</body>
    </html>
  );
}
