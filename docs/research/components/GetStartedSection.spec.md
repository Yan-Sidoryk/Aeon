# GetStartedSection spec ("Get running" timeline)

Reference: https://www.7shifts.com/ — `.traffic-warden-root` child #5 ("Get running in under 30 days"),
y ≈ 8061, height ≈ 772 at 1440px. Extracted with Playwright (computed styles, rAF-sampled motion, CSSOM media rules).
Screenshots: `docs/design-references/get-started/7s-get-started-{1440,1024,768,390}.jpg`
(the 768 shot has 7shifts' fixed header drawn over the subheading) and `docs/design-references/7s-09-get-running.jpeg`.

Implementation: `src/components/GetStartedSection.tsx` (server) + `src/components/get-started/RevealCard.tsx`
(client, IntersectionObserver) + `src/components/get-started/reveal.module.css`.

## Overview
Centered H2, one-line subhead and a royal pill CTA, then a three-step timeline. From 810px up: grey step pills sit
above a hairline with one dot per step, and three pastel cards (lavender / periwinkle / lime) sit side by side, each
with an H3 and three black check-circle items. Below 810px the pills row, hairline and dots are hidden, the cards
stack, and each card shows its step as a violet pill inside the card. The cards fade up once, staggered, on scroll.

## 7shifts breakpoints (from the CSSOM, not Tailwind defaults)
`sm` 567px, **`md` 810px**, `lg` 1024px, **`xl` 1200px**, `2xl` 1374px (+ container steps at 376 / 400px).
At exactly 768px, 7shifts renders the mobile layout. Our theme's `md` is 768px, so this section uses
`min-[810px]:` for 7shifts' `md` and `lg:` (1024px, identical) for `lg`.

## DOM structure (7shifts → Aeon)
```
div.bg-white.relative.z-10.-my-[60px].py-[60px]                 → div[data-section="get-started"]  (same classes)
└ section.bg-white.flex.justify-center.px-5.md:px-[60px].lg:px-20.py-10.md:py-20.rounded-b-[40px]
  └ div.max-w-[1200px].w-full.flex.flex-col.gap-10
    ├ div.flex.flex-col.gap-5.items-center.text-center
    │ ├ h2.font-medium.text-2.5xl.md:text-4xl.lg:text-5xl.md:-tracking-[0.88px].leading-[1.1]
    │ ├ p.font-sfRegular.text-base.md:text-lg.leading-[1.5]
    │ └ a (pill: h-12 px-4 rounded-full bg-royal-blue, font-medium 16/24)   → <PillButton href={START_HREF}>
    └ div.flex.flex-col.gap-5
      ├ div.hidden.md:flex.flex-col.gap-2.5                               (aria-hidden in Aeon)
      │ ├ div.flex.gap-[60px] → 3 × div.flex-1.flex.justify-center > div.bg-light-gray.px-4.py-2.rounded-full > p.text-xs.font-medium.whitespace-nowrap
      │ └ div.relative.flex.gap-[60px]
      │   ├ div.absolute.left-0.right-0.top-1/2.h-px.bg-steel-gray/30.-translate-y-1/2   (hairline)
      │   └ 3 × div.flex-1.flex.items-center.justify-center.relative.z-10 > div.w-2.5.h-2.5.rounded-full.bg-steel-gray/30.flex-shrink-0
      └ div.flex.flex-col.md:flex-row.gap-5.md:gap-[60px]
        ├ div.flex.md:hidden.flex-col.gap-2.5.items-center.w-2.5 > div.w-0.5.flex-1.bg-steel-gray/30   (empty mobile rail, 0px tall)
        └ div.flex.flex-col.md:flex-row.gap-5.flex-1                     → <ol>
          └ 3 × div.bg-{light-purple|sky-blue|lime-green}.p-5.rounded-2.5xl.flex.flex-col.gap-5.flex-1.relative   → <li> (RevealCard)
            ├ div.md:hidden > div.bg-[#C293F1].px-4.py-2.rounded-full.inline-block > p.text-xs.font-medium.text-[#000000]
            ├ h3.font-medium.text-lg.md:text-2.5xl.leading-[1.1]
            └ div.flex.flex-col.gap-5                                    → <ul>
              └ 3 × div.flex.gap-5.items-start                           → <li>
                ├ div.flex-shrink-0.mt-0.5 > div (20×20) > svg.w-5.h-5 (phosphor CheckCircle "fill", 27×27 viewBox)
                └ p.font-sfRegular.text-base.md:text-lg.leading-[1.5]
```

## Computed styles (7shifts)
| Element | Value |
| --- | --- |
| Wrapper | bg #fff; position relative; z-index 10; margin -60px 0; padding 60px 0 (top 60px hides under the black social-proof sheet, z-20; bottom 60px sits under the FAQ sheet, z-50) |
| Section | bg #fff; display flex; justify-content center; padding 40px 20px (<810) · 80px 60px (810–1023) · 80px (≥1024); border-radius 0 0 40px 40px |
| Inner | max-width 1200px; width 100%; flex column; gap 40px |
| Header block | flex column; align-items center; text-align center; gap 20px |
| H2 | 7sans "medium" → **Geist** (`font-display`); weight 500; color #000; 28px/30.8px, letter-spacing normal (<810) · 36px/39.6px, -0.88px (810–1023) · 48px/52.8px, -0.88px (≥1024) |
| Subhead | Inter Tight 400; 16px/24px (<810) · 18px/27px (≥810) |
| CTA | 48px tall; padding 0 16px; radius 9999px; bg #4570FF; white Geist 500 16px/24px; transition 150ms cubic-bezier(0.4,0,0.2,1); hover bg #3658C9 (shared `PillButton`) |
| Timeline block | flex column; gap 20px |
| Desktop timeline | flex column; gap 10px; pills row & dots row both `gap: 60px` with three `flex: 1` columns (360px each at 1440) |
| Step pill (desktop) | bg #F1F0EC; padding 8px 16px; 32px tall; radius 9999px; text Geist 500 12px/16px, nowrap |
| Hairline | position absolute; left/right 0; top 50%; translateY(-50%); height 1px; bg #6E6D6C @ 30% |
| Dot | 10×10px; radius 9999px; bg #6E6D6C @ 30%; centered in its column; z-index 10 (the line shows through the translucent dot) |
| Cards row | flex column, gap 20px (<810) · flex row, gap 60px (≥810; only the card container is visible so the gap is inert) |
| Mobile rail | 10px wide flex column, gap 10px; 2px bar, flex 1 → collapses to 0px height; net effect: +20px before card 1 on mobile |
| Card container | flex column (<810) / row (≥810); gap 20px |
| Card | padding 20px; radius 20px; flex column; gap 20px; flex 1; position relative; bg #EBDCFF / #D6E0FF / #C6FF94. Size 386.67×211.8 (1440), 275×297 (1024), 728×244 (768), 350×244 (390) with 7shifts copy |
| Mobile step pill | display (only <810); bg #C293F1; padding 8px 16px; 32px tall; Geist 500 12px/16px #000 |
| Card H3 | Geist 500; 18px/19.8px (<810) · 28px/30.8px (≥810) |
| Check list | flex column; gap 20px; item = flex row, align-items flex-start, gap 20px |
| Check icon | 20×20, margin-top 2px; black circle with the check **cut out** (the card color shows through) |
| Item text | Inter Tight 400; 16px/24px (<810) · 18px/27px (≥810) |

## States & behaviors
### 1. Card reveal on scroll (the only motion in the section)
- **Trigger:** card enters the viewport. 7shifts uses framer-motion `whileInView` with `once`.
- **Before (SSR inline style):** `opacity: 0; transform: translateY(16px)`.
- **After:** `opacity: 1; transform: none` (inline `opacity: 1; transform: none;` left behind).
- **Transition:** 500ms, `cubic-bezier(0, 0, 0.58, 1)` (framer "easeOut"; least-squares fit over rAF samples:
  error 6.7e-5 vs 4.0e-4 for sine-out, 3.6e-3 for quad-out) on both opacity and transform.
- **Stagger:** card n starts n × 150ms after the trigger (measured starts 138 / 288 / 437ms after a single scroll jump).
- **Threshold (measured by stepping the scroll 8px at a time):**
  - ≥810 (cards in a row): all three trigger together once 34–38% of the card is inside the viewport (≈ `amount: 0.35`).
  - <810 (stacked): each card triggers by itself once 8–20px of its 244px (≈ 5%) is visible.
- **Replay:** none. Scrolling away and back leaves the cards visible.
- Heading, subhead, CTA, pills, hairline and dots are static (no transition, no animation).

**Aeon:** `RevealCard` observes its own `<li>` (IntersectionObserver, threshold 0.35 when `(min-width: 810px)`
matches, else 0.05; disconnects after the first hit). CSS module: 500ms `cubic-bezier(0,0,0.58,1)` on opacity and
transform; delay via `delay-0 / delay-150 / delay-300`. The hidden state is only applied under
`@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`, so no-JS and reduced-motion visitors get the
cards immediately. Verified on localhost: starts 150ms apart, ~500ms each, opacity/translate progress in lockstep;
thresholds 0.34–0.38 (desktop) and 8→20px / 16→26px / 24→36px (mobile) vs 7shifts 8→20 / 16→27 / 24→34.

### 2. CTA hover
royal #4570FF → #3658C9, 150ms cubic-bezier(0.4,0,0.2,1) (shared `PillButton`).

No hover states on pills, dots or cards.

## Aeon content mapping
| 7shifts | Aeon |
| --- | --- |
| H2 "Get running in under 30 days" | "Your first AI visibility report in 5 minutes" |
| Subhead | "Type your company website. Aeon finds your portfolio, competitors and the questions people ask, then runs a live scan." |
| CTA "Get started, it's free!" → /signup/ | "Start your free report" → `START_HREF` |
| Pills Today / Day 14 / Day 30 | Minute 1 / Minute 5 / Day 30 |
| Card 1 (light-purple) | "Enter your website." ✓ Portfolio found from your site and FDA labels ✓ Competitors and prompts pre-filled ✓ Pick one hero drug to start |
| Card 2 (sky-blue) | "Read your first report." ✓ Visibility score vs. your top competitor ✓ Answers that contradict the label ✓ Top 3 fixes, one click each |
| Card 3 (lime-green) | "Ship your first fix." ✓ Draft approved through pre-MLR ✓ Weekly re-scans across your portfolio ✓ Before and after you can share |

## Assets
None beyond the shared `CheckCircleIcon` (circle = `currentColor` black, `checkColor` = the card background
#ebdcff / #d6e0ff / #c6ff94 to reproduce 7shifts' cut-out check).

## Responsive summary (7shifts, section-relative)
| | 1440 | 1024 | 768 | 390 |
| --- | --- | --- | --- | --- |
| Section padding | 80px | 80px | 40px 20px | 40px 20px |
| Inner width | 1200 | 864 | 728 | 350 |
| H2 | 48/52.8, -0.88 | 48/52.8, -0.88 | 28/30.8 | 28/30.8 (2 lines) |
| Subhead | 18/27 | 18/27 | 16/24 | 16/24 |
| Timeline pills/line/dots | shown | shown | hidden | hidden |
| Cards | row, 386.67 wide, gap 20 | row, 275 wide | stacked, 728 wide, gap 20 | stacked, 350 wide |
| Card H3 / items | 28/30.8 · 18/27 | 28/30.8 · 18/27 | 18/19.8 · 16/24 | 18/19.8 · 16/24 |
| In-card violet pill | hidden | hidden | shown | shown |
| CTA → first card | 112px | 112px | 60px | 60px |

## Deliberate deviations
- Semantics: the cards are an `<ol>` of `<li>` and each item list a `<ul>` (7shifts uses divs). The desktop pills row and
  hairline are `aria-hidden`; the in-card step pill is `min-[810px]:sr-only` instead of `md:hidden`, so every card
  announces its step at every width. No visual change.
- Card heights follow the Aeon copy (card 1's first item wraps at 1440, so the row is 239px instead of 212px).
