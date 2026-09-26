# SiteFooter spec

Reference: `footer` on https://www.7shifts.com/ (the last element of the page).
Extracted with Playwright at 1440, 768 and 390 (computed styles + boxes), plus hover probes and
lossless screenshots with the footer images loaded. References:

- `docs/design-references/footer/7s-footer-1440.jpg`: full footer, desktop (images loaded)
- `docs/design-references/footer/7s-footer-768.jpg`: full footer, tablet (images loaded)
- `docs/design-references/footer/7s-footer-390.jpg`: full footer, mobile (layout only; 7shifts assets were rate-limited, so their images show as broken)
- `docs/design-references/footer/7s-footer-hover-states.jpg`: hovered column link, hovered AI tile (2nd), hovered social icon (LinkedIn), hovered legal link
- `docs/design-references/footer/7s-footer-icons-zoom.jpg`: 3x zoom of the AI tiles and the social icons
- `docs/design-references/7s-12-footer.jpeg`: real-Chrome viewport capture of the footer bottom

## Overview

A rounded-top off-white sheet (`#FBFAF8`, radius 40px top corners, `relative z-50`) that slides over the
bottom 100px of the section above (that section carries `pb-[100px] -mb-[100px]`). Inside a 1120px column:

1. a headline row (category headline left, icon logo right) with a 2px divider under it;
2. a grid of link columns (120px tracks, 60px gaps; the first column spans two tracks with a 2-up list);
3. a 1px divider, then "Ask AI for a summary of …" with five 40x40 assistant tiles;
4. a right-aligned row of social icons;
5. a full-bleed black legal bar ("… © 2026" left, legal links right).

No accordions at any width: on mobile the columns simply reflow into a 2-track grid.
Interaction model: hover only (underline on text links, opacity on AI tiles, brightness on social icons).
No scroll- or time-driven behaviour.

### Breakpoints (important)
7shifts' Tailwind build uses **md = 810px, lg = 1024px, xl = 1200px** (read from the stylesheet:
`.max-md\:flex-col-reverse` lives in `not all and (min-width: 810px)`, `.md\:justify-end` in
`(min-width: 810px)`, `.xl\:grid-rows-9` in `(min-width: 1200px)`). Our Tailwind uses the defaults
(md 768, xl 1280), so the footer uses arbitrary variants: `max-[810px]:` / `min-[810px]:` for 7shifts'
`max-md:` / `md:`, and plain `lg:` (1024, identical). At 768 this matters: 7shifts shows the mobile headline
arrangement (logo above a 28px headline) and left-aligned legal links there.

## DOM structure (7shifts, exact classes)

```
footer.bg-extra-light-gray.relative.z-50.rounded-t-[40px]
  div.px-5.lg:px-10.pb-5.lg:pb-5.pt-9
    div.flex.flex-col.max-w-[1120px].m-auto.gap-10
      div.flex.justify-between.w-full.max-w-[1020px].mx-auto.border-b-2.border-gray-300.pb-5.max-md:flex-col-reverse.max-md:gap-y-5
        div.flex.flex-col.justify-center > h2.text-[40px].leading-[90%].font-medium.max-md:text-[28px]   "Restaurant HR Platform"
        div.flex.flex-col.justify-center > img (icon logo, 38x38)
      div.grid.justify-start.gap-[60px].grid-cols-[repeat(auto-fill,100px)].lg:grid-cols-[repeat(auto-fill,120px)].lg:justify-center.relative
        div.flex.flex-col.gap-6.w-full.leading-4.text-sm.col-[auto_/_span_2]            (Products)
          h2.font-bold.antialiased.tracking-wide
          ul.grid.tracking-tight.gap-5.grid-cols-[repeat(2,120px)].lg:grid-rows-[repeat(2,minmax(0,1fr))].xl:grid-rows-9.auto-rows-fr
            li.hover:underline.leading-[14px] > a
        div.flex.flex-col.gap-6.w-full.leading-4.text-sm                                  (Company, Resources: same ul classes but grid-cols-[repeat(1,minmax(120px,_1fr))])
        div.flex.flex-col.gap-6.w-full.leading-4.text-sm                                  (Built For, Support: ul WITHOUT the grid-rows / auto-rows-fr classes)
          (Support also holds a second group "Customer Stories", hidden below lg)
        div.… .lg:hidden                                                                  ("Customer Stories" + App Store / Google Play badges, mobile only)
      div.border-t.border-gray-300.pt-5
        div.flex.flex-col.gap-4
          h3.text-sm.font-medium.text-gray-700   "Ask AI for a summary of 7shifts"
          div.flex.gap-4.items-center
            a.hover:opacity-70.transition-opacity[target=_blank][aria-label="Ask ChatGPT about 7shifts"] > img.rounded-lg (40x40)
            … Claude, Perplexity, Gemini, Grok
      ul.flex.justify-end.gap-4.items-center
        li > a.inline-flex.rounded-sm.hover:brightness-75[target=_blank] > img (19px wide)
  div.flex.flex-col.lg:flex-row.lg:justify-between.py-5.px-10.bg-black.text-xs
    div.flex.flex-col.lg:flex-row.gap-5.max-w-[1120px].m-auto.justify-between.w-full.antialiased.tracking-tighter
      div.flex.gap-2.5.items-center > p.text-white.whitespace-nowrap   "7shifts © 2026"
      ul.flex.gap-5.text-light-gray.flex-wrap.md:justify-end
        li.whitespace-nowrap > a.flex.gap-1.hover:underline      (Cookie Preferences is a button.hover:underline)
```

## Computed styles (1440 unless noted)

| Element | Values |
| --- | --- |
| footer | bg `rgb(251,250,248)` #FBFAF8; radius `40px 40px 0 0`; position relative; z-index 50; font 16px/24px interTight, color #000. Height 963px with images loaded |
| inner wrapper | padding `36px 40px 20px` (lg+) / `36px 20px 20px` (<lg) |
| column | max-width 1120, centered (x 160 at 1440), flex column, gap 40px |
| headline row | width 1020 (max), centered (x 210); `justify-content: space-between`; padding-bottom 20; border-bottom `2px solid` gray-300 (#D1D5DC); height 60 (38 content + 20 + 2) |
| headline h2 | font "medium" (7sans → our `font-display` Geist) 40px, weight 500, line-height 36px (90%), #000; 28px / 25.2px below 810px. Box 422x36 at y+1 (centred in 38px) |
| icon logo | 38x38 image, right edge of the row (x 1192) |
| headline row <810 | `flex-direction: column-reverse`, row-gap 20px → logo on top (38px), 20px gap, 25.2px headline, 20px, 2px border = 105.2px |
| link grid | `grid-template-columns: repeat(auto-fill,120px)` (lg+) / `repeat(auto-fill,100px)` (<lg); gap 60px both axes; `justify-content: center` (lg+) / `flex-start` (<lg). At 1440: 6 tracks = 1020px starting at x 210 |
| column group | flex column, gap 24px, font 14px, line-height 16px, width 100% of its track(s); first group spans 2 tracks (300px at lg+, 260px below) |
| column heading h2 | interTight 14px, weight 700, line-height 16px, letter-spacing 0.35px (tracking-wide), #000, antialiased |
| list ul | grid, gap 20px, letter-spacing -0.35px (tracking-tight); cols `repeat(2,120px)` (first group) or `repeat(1,minmax(120px,1fr))` (others; 120px wide even inside a 100px track on mobile) |
| list rows | first three lists: `auto-rows-fr` → every row as tall as the tallest item (14px, or 28px if any item wraps). Last two lists: auto rows (14px, 28px for a wrapped item) |
| link li / a | interTight 14px/14px (`leading-[14px]`), weight 400, letter-spacing -0.35px, #000; a is inline (box 17px per line) |
| Ask AI block | border-top `1px solid` #D1D5DC, padding-top 20px; inner flex column gap 16px; height 97 |
| Ask AI h3 | font "medium" (→ Geist) 14px/20px, weight 500, color gray-700 `#364153` |
| AI tiles row | flex, gap 16px, align center; each `a` 40x40 display block, `transition: opacity .15s cubic-bezier(.4,0,.2,1)`; image radius 8px |
| social ul | flex, `justify-content: flex-end`, gap 16px, align center. Each li is a text line (16px/24px) holding an inline-flex `a` (radius 4px) with a 19px-wide image sitting on the baseline → li ≈ 25px tall for a 19x19 icon (24px for the 19x14 YouTube icon). Row height 26px on 7shifts (tallest icon 19x20) |
| legal bar | bg #000; padding 20px 40px; font 12px/16px interTight; height 56px at lg+ (a 20px-tall broken image made it 60 in the raw extraction) |
| legal inner | max-width 1120, centered; flex (row at lg+, column below) with gap 20px, `justify-content: space-between`; letter-spacing -0.6px (tracking-tighter); antialiased |
| copyright p | #FFFFFF, nowrap |
| legal ul | color #F1F0EC (sand); flex, wrap, gap 20px (both axes); `justify-content: flex-end` from 810px up |
| legal li / a | nowrap; a is `display:flex; gap:4px`; 16px tall |

Vertical rhythm at 1440 (7shifts): 36 pt · 60 headline row · 40 · 548 grid · 40 · 97 ask block · 40 · 26 socials · 20 pb · 56 legal = 963.

### AI tiles (sampled from lossless screenshots)
| Tile | Background | Glyph |
| --- | --- | --- |
| ChatGPT | `#74AB9B` | near-white (#FAFEFF) knot, ≈26px |
| Claude | `#D67657` (≈ #D57657–#D77657) | cream (#FFFDF1) starburst, ≈26px |
| Perplexity | `#1F1F1F` | white line glyph, ≈24x25px |
| Gemini | `#FFFFFF` with a 1px inner edge `#EBEAE9` on the right and bottom only | 4-point sparkle ≈21px, gradient blue `#0A7EF9` (left/bottom) → `#5585FE` → lavender `#A197E3` (right/top) |
| Grok | `#000000` | white slashed circle, ≈24px |

### Social icons
Black glyphs, 17px ink inside a 19px box (1px padding). The cut-outs are **filled with #FBFAF8** (not transparent):
on hover the whole image gets `filter: brightness(0.75)`, and the hovered LinkedIn "in" renders `rgb(188,187,186)`
= 0.75 × #FBFAF8. Facebook/X/Instagram/LinkedIn 19x19, Spotify 19x20, YouTube 19x14.

## States & behaviors

| Target | Before | After (hover) | Transition |
| --- | --- | --- | --- |
| Column link (`li`) | text-decoration none | `underline` (auto thickness/offset), colour unchanged #000 | none (instant) |
| AI tile (`a`) | opacity 1 | opacity 0.7 (0.72 sampled at 60ms) | `opacity 150ms cubic-bezier(0.4,0,0.2,1)` |
| Social icon (`a`) | filter none | `brightness(0.75)` (glyph stays black, #FBFAF8 cut-outs → #BCBBBA) | none |
| Legal link / Cookie button | none | `underline`, colour stays #F1F0EC | none |
| Focus (any link) | — | `outline: 1px solid rgb(54,88,201)` (#3658C9), `outline-offset: 2px` | — |

Cursor: pointer on links; the 7shifts "Cookie Preferences" `button` keeps `cursor: default`.

Links: AI tiles and social icons open in a new tab (`target=_blank rel="noopener noreferrer"`). AI tiles carry
`aria-label="Ask <Assistant> about 7shifts"`. AI URL patterns (prompt `encodeURIComponent`-encoded):

| Assistant | 7shifts URL pattern |
| --- | --- |
| ChatGPT | `https://chatgpt.com/?q=<prompt>` |
| Claude | `https://claude.ai/new?q=<prompt>` |
| Perplexity | `https://www.perplexity.ai/?q=<prompt>` |
| Gemini | `https://www.google.com/search?udm=50&aep=11&q=<prompt>` (Google AI Mode) |
| Grok | `https://x.com/i/grok?text=<prompt>` |

## Aeon content mapping

| 7shifts | Aeon |
| --- | --- |
| Headline "Restaurant HR Platform" | **"AI Visibility for Pharma"** (not in the copy deck; category line chosen from the PRD positioning. Geist 40px measures 423px vs the original 422px and stays on one line at 28px on mobile) |
| 7shifts icon logo (38x38) | `<AeonLogo variant="mark" className="w-[38px]" />` (ring + royal-blue dot) |
| Products (spans 2 tracks, 2-up list) | **Platform** (spans 2 tracks, 2-up list): AI visibility tracking, Accuracy vs. label, Content fixes, AI pre-MLR review, Technical SEO audit, Citation map, Recommendations → `#platform` |
| Company | **Company**: About `/about`, Careers `/careers`, Contact `/contact`, Security `/security`, Pricing `/pricing`, Book a walkthrough `/contact` |
| Resources | **Research**: Research hub, GEO Playbook 2026, Aeon Index, GEO for pharma, GEO for life sciences, AEO for pharma, Methodology → `#resources` |
| Built For | **Built for**: Brand & digital marketing, Medical affairs, Regulatory & MLR, Pharmacovigilance, Agencies, Rx brands, OTC & consumer health, Biotech → `#personas` |
| Support (+ Customer Stories) | **Support**: Help center `/help-center`, Contact sales `/contact-sales`, System status `/system-status` (no Customer Stories: Aeon shows no customers) |
| Mobile "Customer Stories" + app badges | dropped (no equivalent) |
| "Ask AI for a summary of 7shifts" | "Ask AI for a summary of Aeon"; prompt: "Summarize what Aeon (AI visibility and pre-MLR platform for pharma brands) does and who it is for." |
| AI tile images | same five coloured tiles with simple generic inline-SVG glyphs (atom, sunburst, framed diamond, 4-point sparkle, slashed circle), not the brands' logo artwork |
| Social: Facebook, X, Instagram, LinkedIn, Spotify, YouTube | LinkedIn, X, YouTube (generic inline SVGs, `href="#"` placeholders, `aria-label="Aeon on …"`) |
| "7shifts © 2026" | "Aeon © 2026" |
| Legal links | Privacy `/privacy` · Terms `/terms` · DPA `/dpa` · Security `/security` · Cookie preferences `/cookie-preferences` |

With Aeon's copy only "Brand & digital marketing" (140px) and "OTC & consumer health" (135px) exceed the 120px
list width and wrap to two lines; every other item fits (the widest, "Operations Overview"-sized items are ≈116px).

### Deliberately not copied
- `lg:grid-rows-[repeat(2,minmax(0,1fr))] xl:grid-rows-9`: a visual no-op on 7shifts (every list there has ≥ 9 rows),
  but with Aeon's shorter lists the empty explicit `1fr` rows would add blank space. `auto-rows-fr` is kept.

## Assets
None downloaded. Logo from `@/components/AeonLogo`; all icons are inline SVG in `src/components/footer/`.

## Responsive

| | 1440 (lg+) | 768 (<810) | 390 |
| --- | --- | --- | --- |
| inner padding | 36 / 40 / 20 | 36 / 20 / 20 | 36 / 20 / 20 |
| headline row | row: headline left (40px), logo right | column-reverse: logo, 20px, headline 28px | same as 768 |
| link grid | 6×120px tracks centred (x 210): Platform(2) · Company · Research · Built for · Support in one row | 4×100px tracks from the left: Platform(2) · Company · Research / Built for · Support | 2×100px tracks: Platform(2) / Company · Research / Built for · Support |
| AI row, socials | unchanged (socials right-aligned) | unchanged | unchanged |
| legal bar | row: copyright left, links right | column (gap 20): copyright, then links left-aligned (justify-end only from 810px) | column; links wrap with 20px row/column gaps |
