# PlatformSection spec (7shifts "Everything your team relies on" → Aeon platform loop)

## Overview
- **Target files:** `src/components/platform/PlatformSection.tsx` (server component, export `PlatformSection`),
  `src/components/platform/PlatformTabBar.tsx` (client, sticky tab bar + scroll logic),
  `src/components/platform/platform.content.ts` (typed copy), `src/components/platform/platform.module.css` (arrow keyframes).
  Visual panels come from `./PlatformMocks` (`TrackMock`, `VerifyMock`, `FixMock`, `ReviewMock`, `MeasureMock`, owned by the mocks builder).
- **Root:** `<section id="platform" data-section="platform">`, 7shifts section index 1 (y ≈ 1347, height 3499 at 1440 × 900).
- **7shifts references:** `docs/design-references/7s-03-platform-a.jpeg` (first card stuck, 1440 × 865 @2x),
  `docs/design-references/7s-04-platform-stack.jpeg` (3rd card sliding over the 2nd, 1440 × 900),
  `docs/design-references/platform/7s-platform-1440-unstuck.jpg` (full-page capture, cards unstuck, 0.694 scale),
  `docs/design-references/platform/7s-platform-390-full.jpg`, `7s-platform-390-intro-card.jpg` (mobile).
- **Live scroll captures (1440 × 900, section offset in px):** `docs/design-references/platform/7s-platform-1440-scroll-299.jpg`
  (first card stuck, bar 92px), `…-scroll-1353.jpg` (3rd card at y 306, bar 416.6px), `…-scroll-2800.jpg` (the stack leaving and
  covering the tab bar).
- **Sources:** computed styles from Playwright at 390 (`extract.mjs`), the production SSR HTML, CSS and the JS chunk that implements
  this block (component `337927` in `/_next/static/chunks/3jua-1tox9l7k.js`), and a live 1440 × 900 scroll session (probe values
  below). Cloudflare 429s blocked most Playwright runs, so the desktop styles are the source class values, checked against the
  live probes.
- **Interaction model: scroll-driven.** Cards are `position: sticky` and stack as you scroll. The orange bar width follows
  scroll progress through the section, and the active tab comes from an IntersectionObserver. Clicking a tab smooth-scrolls
  so its card sits at its sticky position. There are no hover effects on the tabs, and nothing is time-driven.

## Breakpoints (important)
7shifts' Tailwind theme sets **`--breakpoint-md: 810px`** (lg and xl are the defaults, 1024 and 1280). Every `md:` below means
≥ 810px, so this section uses `min-[810px]:` / `max-[810px]:`. At 768px 7shifts renders the **mobile** layout (no tab bar,
cards stacked, not sticky).

## DOM structure (7shifts → Aeon)
```
div.relative.bg-[#F1F0EC].pt-[100px].pb-[120px].-mt-[60px].px-[20px].xl:px-[60px].md:text-pretty.z-10.md:pt-[140px]   → <section id="platform">
  h2.text-[48px].leading-[90%].-tracking-[0.03em].text-center.mb-[10px].max-w-[1040px].mx-auto.md:px-[40px].xl:px-0
  p.text-[18px].leading-[1.5em].text-center.mb-[40px].max-w-[1040px].mx-auto.md:px-[40px].xl:px-0
  a(Button curacao).w-fit.mx-auto.mb-[44px].px-[24px]                                                                  → PillButton primary
  div.max-md:hidden.xl:max-w-[800px].mx-auto.mb-[28px].md:mb-[40px].sticky.pt-[20px].top-[140px]                       → <nav> (PlatformTabBar)
    div.grid.grid-cols-10
      button.col-span-2.py-[8px].flex.justify-center[aria-pressed] ×5                                                   → aria-current="step"
        div.flex.items-center.gap-[6px]
          div.overflow-hidden.transition-all.duration-300.ease-in-out  style{width: 22px|0px, opacity: 1|0}
            img.w-[22px].h-[22px].shrink-0 (tab doodle)
          p.font-medium.text-[16px] (label)
    div.relative.h-[3px].bg-[#F1F0EC].mt-[4px]
      div.absolute.inset-y-0.left-0.bg-[#FF6808]  style{width: progress%}
  div.flex.flex-col.md:px-[40px].gap-y-[20px].md:gap-y-[40px].xl:gap-y-[80px]                                          → #platform-cards
    div.md:sticky.md:top-[220px]  style{z-index: i}  ×5
      div.xl:max-w-[1040px].xl:mx-auto
        div.bg-white.rounded-[20px].md:bg-transparent.md:rounded-none.flex.flex-col.md:flex-row.overflow-hidden        → <article>
          div.rounded-b-[10px].md:rounded-b-none.md:rounded-l-[20px].md:w-1/2.relative.overflow-hidden  style{bg}     → visual box + <Mock/>
            div.w-full.h-full.min-h-[300px].md:min-h-[420px].flex.items-center.justify-center > Lottie (square)
          div.p-[20px].md:bg-white.md:rounded-r-[20px].md:w-1/2.md:flex.md:flex-col.md:justify-center.md:p-[40px]
            div.mb-[20px]
              img.mb-[10px].w-[60px].h-[60px] (doodle)
              p eyebrow (font-hand)
              p title                                                                                                → <h3>
            p body
            ul.mb-[20px].flex.flex-col.gap-y-[12px] > li.flex.items-center.gap-3 > img check 24px + p
            div.flex.flex-col.md:flex-row.md:justify-start.md:items-center.w-full.md:w-fit.gap-[10px].md:gap-0
              div.flex.flex-col.justify-center.items-start
                a.group.flex.items-center.gap-2.py-3.md:py-1.md:px-2.md:-mx-2.md:-my-1.rounded-full.md:ml-0 (+ focus ring)
                  span.custom-link (label, hover underline)
                  span.md:hidden "→"
                  div.hidden.md:flex.flex-col.justify-center.group-hover:animate-bounce-horizontal > phosphor ArrowRight bold 1em
```

## Computed styles (exact)
| Element | Values |
| --- | --- |
| Section | bg `#F1F0EC`; padding `100px 20px 120px` (≥810: top 140; ≥1280: x 60); margin-top `-60px`; `position: relative; z-index: 10`; ≥810 `text-wrap: pretty`; height 3499 at 1440 × 900 |
| H2 | 7sans "medium" → Geist; 48px / 43.2px (90%), weight 500, letter-spacing −1.44px (−0.03em), centered, mb 10, max-w 1040 (≥810 px 40; ≥1280 px 0). **48px at every width** |
| Sub | Inter Tight 18px / 27px (1.5em), weight 400, #000, centered, mb 40, same max-w/px as the H2 |
| CTA | h 48, px 24, rounded-full, Geist 16/24 500, bg `#4570FF` → hover/active `#3658C9`, 150ms `cubic-bezier(.4,0,.2,1)`; `w-fit mx-auto mb-[44px]` (195 × 48 at 390) |
| Tab bar | sticky `top: 140px`, `padding-top: 20px`, mb 28 (≥810: 40), ≥1280 max-w 800 centered (320–1120 at 1440; full content width below 1280). Height 67 = 20 + 40 (buttons) + 4 + 3. No background |
| Tab button | grid `repeat(10, minmax(0,1fr))`, each col-span-2 (160px at 1440), py 8, content centered; `flex items-center gap-[6px]`; label Geist ("medium") 16/24 500 #000; cursor pointer; no hover change |
| Tab icon wrapper | `overflow: hidden; transition: all .3s cubic-bezier(.4,0,.2,1)`; width `22px`/`0px`, opacity `1`/`0` for `active >= i`. The 6px gap stays when hidden, so an iconless label sits 3px right of the column centre |
| Indicator | track `h-3px mt-4px bg #F1F0EC` (invisible on the section bg); fill `bg #FF6808`, `position: absolute; inset-y: 0; left: 0`, width = progress %, **no transition** |
| Cards column | flex-col; gap 20 (≥810: 40; ≥1280: 80); ≥810 px 40 |
| Card wrapper | ≥810 `position: sticky; top: 220px`; inline `z-index: i` (0…4) |
| Card | ≥1280 max-w 1040 centered (x 200–1240 at 1440). Mobile: `bg-white rounded-[20px] overflow-hidden flex-col`. ≥810: transparent, row, halves `w-1/2`. **No shadow, no scale/dim on covered cards** |
| Visual panel | mobile `rounded-b-[10px]`, square (350 × 350 at 390; the Lottie viewBox is square), min-h 300; ≥810 `rounded-l-[20px]`, min-h 420, square = 520 × 520 at 1440 (card height 520). Backgrounds (7shifts): #DAD8FF, image, #FF6808, #244F47, #4570FF. Aeon: owned by each mock |
| Content | p 20 (≥810: 40), ≥810 white, `rounded-r-[20px]`, flex-col `justify-center` |
| Doodle | 60 × 60, mb 10. 7shifts' drawings sit about 8px inside the box (ink ≈ 44px) |
| Eyebrow | Nanum Pen Script 20px (≥810: 28px), leading 1, weight 400, `#000000BF`, mb 10, `text-box-trim: trim-both; text-box-edge: cap alphabetic` |
| Title | Geist ("medium") 28px (≥810: 36px) / 1.1, weight 500, #000, trimmed |
| Body | Inter Tight 16px / 1.5, weight 400, `#000000BF`, my 20 (collapses with the head's mb 20), trimmed |
| Checks | ul mb 20, gap-y 12; li `flex items-center gap-3`; icon 24 × 24, circle `#404040` + white check; text Inter Tight 16 / 1.5 #000, trimmed |
| Explore link | `gap-2 py-3 rounded-full`; ≥810 `py-1 px-2 -my-1 ml-0 -mr-2` (text indented 8px, as in 7s-04: x 768 vs 760); label Geist 16px/1 500. Focus: 2px royal ring, 2px white offset |
| Link underline (`.custom-link`) | `position: relative; overflow: hidden`; `::after` 1px `currentColor`, `bottom: 0; left: 0; width: 0`, `transition: width .3s ease-in-out`; `:hover::after { width: 100% }` (hover on the label span) |
| Link arrow | < 810: text "→" (11px advance); ≥ 810: phosphor ArrowRight **bold**, 1em (16px), black; on link hover `animation: bounce-horizontal .6s infinite` (ease), keyframes `0%,100% translate(0)`, `50% translate(2px)` |

## States & behaviors (from the 7shifts source)
1. **Progress bar.** On every `scroll` (passive; no resize listener in 7shifts):
   `progress = clamp(-section.getBoundingClientRect().top / (section.offsetHeight - innerHeight), 0, 1)`, and fill width = `progress × 100%`.
   It is 0% until the section top reaches the viewport top and 100% when the section bottom reaches the viewport bottom.
   Example at 1440 × 900: Aeon card 3 at y = 306 gives a 416.5px bar, against ≈417px in 7s-04.
2. **Active tab.** `IntersectionObserver` on the 5 card wrappers, `threshold [0, .1, .25, .5, .75, 1]`,
   `rootMargin "-197px 0px -40% 0px"` (197 = 160 + the 37px banner; the zone at 900 tall is y 197…540). In each callback it takes the
   entry with the highest `intersectionRatio`. If that ratio is above 0.1, that card's tab becomes active (ignored while a click-scroll lock is on).
   - Scrolling down, tab *i* activates when card *i*'s top crosses about 488px (ratio 0.1), roughly 270px before it sticks.
   - Scrolling up there is hysteresis: tab *i−1* returns only when card *i−1* un-sticks and passes 280px (ratio drops through 0.5).
   - Icons: tabs `0…active` show their 22px icon (width 0→22px and opacity 0→1 over 300ms `cubic-bezier(.4,0,.2,1)`). The img
     has `max-width: 100%`, so it squishes horizontally while the wrapper grows.
3. **Stacking.** Cards sit 600px apart at 1440 (520 + 80 gap). Each sticks at 220px, and the next one, with a higher z-index, slides over it with
   no transform, shadow or dimming. When the column ends, all five cards leave together. The tab bar sticks inside the section's content
   box, so the leaving stack slides **over** the tab bar (cards paint later) before the bar itself scrolls away.
4. **Tab click.** It sets a 1s observer lock and activates the tab immediately. The card's natural top is measured (7shifts sets inline
   `position: static` on the card, measures, then restores it), then `scrollTo({ top: max(0, naturalTop − 103 − (80 + 37)), behavior: "smooth" })` =
   natural top − 220, so the card lands exactly at its sticky position. Verified on the Aeon build: every target card ends at `top = 220`.
5. **Hover.** Tab buttons show a pointer cursor only. The Explore link gets the underline and the arrow bounce (above). The CTA uses the shared pill hover.
6. **Initial SSR state:** tab 0 icon shown, fill `0%`.

## Live verification (1440 × 900, 7shifts vs Aeon build)
| Probe | 7shifts | Aeon |
| --- | --- | --- |
| Section height / tab bar natural offset / first card offset | 3499 / 352 / 459 | 3499.2 / 352 / 459 |
| Card height / pitch | 520 / 600 | 520 / 600 |
| Offset 299: bar, card tops | 92.1px, [220, 760, 1360, 1960, 2560] | 92.0px, same |
| Offset 1353: bar, card tops, active | 416.6px, [220, 220, 306, 906, 1506], 2 | 416.5px, same, 2 |
| Offsets 2650 / 2700 / 2800 / 3100: stack top | 209 / 159 / 59 / −241 | same |
| Down-scroll tab switches (10px steps) | 580, 1180, 1780, 2380 (next card at 479) | same |
| Up-scroll switches | next card at 289 (step grid 3500−10k) | next card at 280 (grid 3499−10k), the same crossing |
| Down past the end (offset 2930) | active → 0 (quirk) | stays 4 (deviation 1) |

Mobile (390), 7shifts vs Aeon: card 790 vs 789.8, head 144 vs 144.16, eyebrow 13.48 vs 13.48, 2-line title 50.52 vs 50.67,
3-line body 59.64 vs 59.64, list 96 vs 96, check text 11.64 vs 11.64, link row 40 vs 40.

## Aeon content mapping
| 7shifts | Aeon |
| --- | --- |
| H2 "Everything your team relies on, working together" | "From website to cross-LLM report in minutes" |
| Sub | "Aeon runs the whole loop: find the gaps in AI answers, draft the fix, and make it approval-ready before a reviewer ever opens it." |
| CTA "Get started, it's free!" | "Start your free report" → `START_HREF` |
| Tabs Hire / Train / Schedule / Pay / Retain | Track / Verify / Fix / Review / Measure (icons: `/images/doodles/doodle-{track,verify,fix,review,measure}.png`) |
| Card eyebrow = tab label, title, body, 3 checks, "Explore X" | copy deck §5 (`platform.content.ts`); every link → `#platform` for now |
| Lottie/image visual | `TrackMock`, `VerifyMock`, `FixMock`, `ReviewMock`, `MeasureMock` in an absolutely filled square box. Mocks must paint an **opaque** background, because on desktop the card itself is transparent and the leaving stack has to cover the tab bar |

## Assets
- Doodles: `/public/images/doodles/doodle-*.png` (240 × 240, transparent), shown at 60px (card, 8px inset) and 22px (tab, 3px inset)
  so the ink footprint matches 7shifts' (≈44px and ≈16px).
- Check: shared `CheckCircleIcon` in `#404040` (sampled from 7shifts' `check-icon.png`).
- Arrows: shared `ArrowRightBoldIcon` (≥810; the same path as 7shifts' phosphor bold) and `ArrowThinIcon` cropped to 11.5px (<810, standing in for the 7sans "→" glyph).

## Responsive behavior
| Width | Layout |
| --- | --- |
| 390 (mobile, < 810) | Section px 20, pt 100. H2 48px wraps (4 lines for the Aeon copy, 3 for 7shifts). No tab bar. Cards stack with 20px gaps, not sticky: white rounded-20 card, square visual on top (350 × 350, bottom corners 10px), content p 20, link py 12 with the text arrow |
| 768 | Same as mobile (below 7shifts' 810 breakpoint): card 728 wide, square 728 visual |
| 810–1023 | Tab bar visible (full content width, sticky 140). Cards row + sticky 220, column px 40, gap 40; the halves share the width and card height = max(square visual, content, 420) |
| 1024 | Tab bar 984 wide (tabs 196.8), cards 904 wide (halves 452, height ≈ 496 with Aeon copy) |
| ≥ 1280 (xl) | Section px 60, tab bar max 800 centered, cards max 1040 centered, gap 80. 1440: cards x 200–1240, 520 tall, section 3499 tall |

## Deliberate deviations
1. **Tie-break in the observer.** When the whole stack scrolls away (or comes back) all five cards report the same ratio. 7shifts keeps the first
   entry and flips the tab to the first card while the last card is on screen; Aeon keeps the frontmost card. The ordinary scroll-down and
   scroll-up thresholds are unchanged.
2. **Accessibility.** Tabs use `aria-current="step"` instead of `aria-pressed` and get a visible focus ring (7shifts sets `outline-none`).
   The tab bar is a `<nav aria-label="Platform steps">`, titles are `<h3>`, and doodles are decorative (`alt=""`). Click-scroll respects
   `prefers-reduced-motion`. The bar also updates on `resize`.
3. **Tab icon squish.** The img keeps a 22px box (`max-w-none`) and scales with `scaleX` on the same 300ms curve, which looks the same as 7shifts'
   width squish without Next's "width modified" dev warning.
4. **Doodle inset and mobile arrow** (see Assets): these match the visual footprint of 7shifts' assets and glyph, not the raw box.
