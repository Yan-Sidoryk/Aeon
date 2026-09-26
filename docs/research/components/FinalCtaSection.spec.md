# FinalCtaSection spec (7shifts SECTION index 7 → Aeon final CTA)

Source: https://www.7shifts.com/, `.traffic-warden-root` child #7. Extracted with Playwright (computed styles,
hydrated DOM, full stylesheet text, motion sampling, a resize sweep 1440 → 566px, hover hit-tests).
Raw captures: `scratchpad/tools/out/cta/cta-{1440,768,390}.json|png`.
References (`docs/design-references/cta/`): `7s-cta-1440.jpg`, `7s-cta-viewport-1440.jpg`,
`7s-cta-resources-strip-1440.jpg` (FAQ → CTA → resources → footer overlaps), `7s-cta-768.jpg`, `7s-cta-390.jpg`,
`7s-cta-viewport-390.jpg`; plus `docs/design-references/7s-11-cta-resources.jpeg` (logos/covers loaded).

## Overview
Royal-blue rounded panel that overlaps the FAQ above and the resources section below. Headline block (white
headline with a lime phrase, two pill buttons) plus an infinitely scrolling strip of white stat cards:
- **≥1200px**: two columns; the cards form a **vertical** column (moving up) clipped by the panel edges.
- **<1200px**: stacked; the cards form a **horizontal** strip (moving left) with faded edges.
Pure CSS animation. No pause on hover, no card hover state.

## 7shifts breakpoints (live stylesheet, NOT Tailwind defaults)
`sm` 567px · `md` **810px** · `lg` 1024px · `xl` **1200px** (`--breakpoint-md: 810px`; every `md:`/`xl:` class here
resolves to `min-width: 810px` / `min-width: 1200px`). The Aeon theme sets the same values
(`--breakpoint-sm/md/lg/xl` = 567/810/1024/1200px in globals.css), so the component uses 7shifts' own
`md:` / `lg:` / `xl:` / `max-md:` class names and flips at exactly the same widths.

## DOM structure (hydrated)
```
div.relative.z-50.rounded-[40px].-my-[40px]                         ← wrapper (overlaps FAQ by 40px, resources by 40px)
  section.bg-[#4570FF].rounded-[40px].p-[40px].xl:py-0
    div.max-w-[1200px].mx-auto.xl:flex
      div.xl:py-[40px].xl:w-[50%].xl:flex.xl:flex-col.xl:justify-center     ← text column
        div.text-[48px].leading-[100%].text-white.-tracking-[0.03em].mb-[24px].md:text-[64px]
          h2  "Start managing your team " + span.text-[#C6FF94] "in one platform"
        div.flex.gap-[10px]   a "Start free trial" (light-gray pill)   a "Book a demo" (2px light-gray outline)
      div.mt-[40px].xl:mt-0.xl:w-[50%].xl:flex.xl:justify-end               ← marquee column
        ≥1200 (JS-rendered variant):
        div.w-full.overflow-hidden.relative.md:h-[440px].md:max-w-full.xl:max-w-[450px].xl:h-[440px]
          div.flex.flex-col  style="gap:6px; animation:20000ms linear infinite scroll-down; will-change:transform"
        <1200 (JS-rendered variant):
        div.w-full.overflow-hidden.relative.horizontal-shadow
          div.flex.flex-row  style="gap:6px; animation:12000ms (≥810) | 8000ms (<810) linear infinite scroll-right"
        track children: 3 × card, then div.contents[aria-hidden=true] with the same 3 cards
card = div.w-full.bg-white.flex.rounded-2.5xl.p-7.items-center.min-w-80.md:min-w-80.md:max-w-80.lg:max-w-96.max-md:max-w-64.flex-shrink-0
         div.flex.flex-col.flex-1   p.text-5xl.font-medium "1.1k"   p.max-md:leading-4.text-steel-gray "Reviews"
         div.flex.flex-1.gap-3.items-center   img.h-7.w-7 (platform logo 28×28)   img.max-h-5.max-w-24 (stars 96×17)
```

## Computed styles @1440 (exact)
| Element | Values |
| --- | --- |
| wrapper | `position:relative; z-index:50; border-radius:40px; margin:-40px 0` → y=9607, h=440 |
| section | `background:#4570FF; border-radius:40px; padding:0 40px` (xl), `padding:40px` below xl |
| inner | `max-width:1200px; margin:0 auto; display:flex` (x=120…1320) |
| text column | `width:50% (600px); padding:40px 0; flex column; justify-content:center` |
| h2 | `font-family:"medium" (7sans) → Aeon font-display (Geist); weight 500; 64px/64px (48px/48px below 810); letter-spacing -0.03em (-1.92px / -1.44px); #fff; margin-bottom:24px`. 600×128 (2 lines) |
| highlight span | `color:#C6FF94`, inline |
| buttons row | `display:flex; gap:10px`; buttons `h 48; padding 0 16px; radius 9999px; 500 16px/24px "medium"; transition all 150ms cubic-bezier(0.4,0,0.2,1)` |
| "Start free trial" | bg `#F1F0EC`, #000, no border → hover bg `#E2DED6` |
| "Book a demo" | transparent, `border:2px solid #F1F0EC`, #fff → hover bg `#F1F0EC`, #000 |
| marquee column | `width:50%; display:flex; justify-content:flex-end` |
| clip viewport (xl) | `450×440; overflow:hidden; position:relative` (x=870…1320); no mask |
| track (xl) | `flex column; gap 6px; will-change transform; scroll-down 20s linear infinite`; 450×798 (6 cards) |
| card | `384×128 (lg:max-w-96); min-width 320; padding 28px; radius 20px; #fff; flex; align-items center` (x=870…1254) |
| value | `"medium" 500 48px/48px` (text-5xl), #000 |
| label | `interTight 400 16px/24px; #6E6D6C` (steel-gray); `line-height:16px` below 810 |
| logo + stars | `flex:1; gap 12px`; logo 28×28, stars 96×17 |

## Responsive (from the live resize sweep)
| Width | 7shifts | Panel h |
| --- | --- | --- |
| ≥1200 | two columns; vertical marquee 450×440, cards 384×128, `scroll-down` 20s | 440 |
| 1024–1199 | stacked (`padding:40px`); H2 64px; horizontal strip full width × 128, cards 384×128, `scroll-right` 12s | 448 (2-line H2) |
| 810–1023 | stacked; H2 64px; strip × 128, cards 320×128, 12s | |
| <810 | stacked; H2 48px; strip × 120 (label line-height 16px), cards 320×120 (`min-w-80` beats `max-w-64`), 8s | 408 @768, 456 @390 |
Horizontal viewport class `.horizontal-shadow` = `mask-image: linear-gradient(90deg, transparent 0%, #000 12.5%, #000 87.5%, transparent 100%)`.

## States & behaviors
### Marquee (time-driven)
- `scroll-down`: `0% translateY(0) → 100% translateY(-50%)`, linear infinite. Content moves **up** at 399px/20s =
  **19.95 px/s** (sampled: −52.7, −63.0, −73.0, −83.0, −93.3 px at 500 ms steps).
- `scroll-right`: `0% translate(0) → 100% translate(-50%)`, linear infinite. Content moves **left**. The track is
  only as wide as the viewport, so speed = viewport/2 ÷ duration: 19.4 px/s @390 (sampled 19.2), 43 px/s @768,
  39 px/s @1024; the loop snaps back by that half-width (not a whole card), a visible jump every 8–12s.
- Vertical loop: one set = 3×(128+6) = 402px but −50% = 399px → 3px jump per loop.
- Hover: nothing. With the pointer on a card (hit-tested) the track kept moving at ~20px/s and
  `animation-play-state` stayed `running`; no `:hover` rule exists for the scoped `jsx-*` classes.
- Clip at xl: plain `overflow:hidden`, the viewport equals the panel height, so cards are cut flush by the panel's
  straight top/bottom edges.
### Buttons
- `:hover` · "Start free trial" bg `#F1F0EC → #E2DED6` · "Book a demo" bg `transparent → #F1F0EC`, text `#fff → #000` ·
  150ms cubic-bezier(0.4,0,0.2,1). Focus: 2px royal ring, 2px white offset.

## Stacking / overlap
- FAQ (`z-50`, `#F1F0EC`, `rounded-t-[40px]`) ends 40px below the CTA's top; the CTA (same z, later in DOM) paints
  over it, and the sand FAQ shows through the panel's rounded top corners.
- Resources (`-mt-[20px]`, static, white) starts 40px above the panel bottom and is covered by it; white shows
  through the panel's bottom corners.

## Assets
`/images/doodles/doodle-{track,phone,faq,verify,review}.png` (240×240 transparent PNG) via next/image
(`width/height 56`, rendered 40px below 1024 and 56px from 1024), `alt=""`. No 7shifts logos, stars or photos.

## Aeon content mapping & implementation
- Structure/classes mirror 7shifts one-to-one (wrapper, section, inner, columns, h2, buttons row).
- H2 `Explore your brand` + lime `in the AI search era`, inline span as in 7shifts, natural wrap,
  size kept (64px / 48px). The copy was shortened from "Explore your brand’s visibility" (812px in Geist @64px,
  wider than the 600px xl column, which forced three lines) so it keeps 7shifts' two-line rhythm: two lines at
  1440, 1024 and 768 (white lead / lime phrase), three at 390. A non-breaking space in "in the" stops a lone lime
  "in" ending a line.
- Buttons: `PillButton` secondary "Start your free report" (`START_HREF`) + outline "Book a walkthrough"
  (`WALKTHROUGH_HREF`). Row gets `flex-wrap`: the Aeon labels need 386px, more than the 310px phone column.
- Cards: product facts, no ratings/counts/logos. Value + label left (`flex-1`), one doodle right (40px below 1024,
  56px from 1024; `alt=""`, decorative) instead of the 28px logo + 96px stars, so every label stays on one line and
  card heights stay 128/120 like 7shifts.
  `5 min` to your first report (doodle-track) · `7+` AI engines tracked (doodle-phone) · `40` prompts in your first
  scan (doodle-faq) · `0` claims without a source (doodle-verify) · `100%` human sign-off before publish (doodle-review).
- One `<ul>` serves both orientations with CSS only (7shifts swaps markup in JS): `w-max` flex row +
  `animate-marquee-x` + 90deg mask below 1200; `flex-col` + `animate-marquee-y`, 450×440 clip, no mask from 1200.
  Duplicate set = second 5 `<li>` with `aria-hidden`.
- Seamless loops: the track ends with a gap-sized padding (`pr-[6px]` / `pb-[6px]`) so −50% equals one set.
- Speeds: vertical 19.95 px/s (= 7shifts) → 670px set / 33.6s; horizontal 19.4 px/s (= 7shifts @390) →
  1630px set (320 cards) / 84.1s, 1950px set (384 cards, 1024–1199) / 100.6s. Measured on localhost: −20.0 px/s
  vertical, −19.3 px/s horizontal, unchanged on hover.
- `animation-duration` is set directly (`[animation-duration:…]`): the shared `--animate-marquee-*` theme tokens
  resolve `var(--marquee-duration)` at `:root`, so a per-element `--marquee-duration` has no effect.
- Reduced motion: handled by the global rule (animation collapses to the first frame).
