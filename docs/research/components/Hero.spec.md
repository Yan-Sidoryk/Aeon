# Hero (+ AI-engine strip) — component spec

## Overview
- **Reference:** https://www.7shifts.com/ — first child of `.traffic-warden-root` (wrapper `div.bg-white.rounded-b-[40px].z-50.relative`), page y = 37, height 1369.69 px at 1440.
- **Target files:**
  - `src/components/Hero.tsx` — `export function Hero()` (server component, section shell + text block)
  - `src/components/hero/HeroMedia.tsx` — `"use client"`: video frame, overlay UI cards, pause control
  - `src/components/hero/EngineStrip.tsx` — engine wordmark row (replaces the customer-logo row)
  - `src/components/hero/hero.content.ts` — typed copy
  - `src/components/hero/Hero.module.css` — card entrance / float / spinner keyframes
- **Section slug:** `data-section="hero"`.
- **7shifts reference screenshots** (`docs/design-references/hero/`):
  - `7s-hero-1440.jpg` (element shot; fixed announcement bar overlays its top 37 px), `7s-hero-768.jpg`, `7s-hero-390.jpg`
  - `7s-logos-rest-1440.jpg`, `7s-logos-hover-1440.jpg` (4th logo hovered)
  - `7s-video-cards-a.jpg`, `7s-video-cards-b.jpg` (video frames every ~0.9 s), `7s-video-card-closeup.jpg`
  - also `docs/design-references/7s-01-hero.jpeg` (hero with header), `7s-mobile-01-hero.jpeg`
- **Interaction model:** static layout. Verified by scrolling 0 → 900 px: no element in the hero changes position, transform or opacity; `getAnimations()` is empty on load (no entrance animation on 7shifts). Motion is **time-driven** (autoplaying looped video) plus **hover** on the logo items. No click behaviour besides links.

## 7shifts breakpoints (read from their CSS, not Tailwind defaults)
`md` = **810 px**, `lg` = 1024 px, `xl` = **1200 px** (others: 376, 567, 1374, 1536).
At 768 px 7shifts therefore renders the *mobile* hero (48 px H1, 20 px gutters, 3-column logo grid, "55K+" line visible).
`globals.css` now defines these breakpoints, so the Aeon hero uses 7shifts' `md:` / `xl:` classes as-is. Content-driven extras
(not 7shifts breakpoints): `min-[480px]` (swoosh phrase), `640px` (three cards vs one), `min-[900px]` (engine items stop shrinking).

## DOM structure (7shifts → Aeon)
```
div.bg-white.rounded-b-[40px].z-50.relative                         → section[data-section=hero] (same classes)
  div.pt-[80px].px-[20px].pb-[40px].md:px-[40px].max-w-[1200px].mx-auto.xl:pt-[140px]
    div                                                              (text block)
      p.font-nanumPenScript.text-[28px].font-normal.leading-[100%].text-center      eyebrow
      h1.font-medium.text-[48px].leading-[110%].md:hidden.text-center               mobile H1
        "The platform behind great " span.relative.inline-block > span "restaurant teams"
                                        + div.absolute.-bottom-2.left-0.h-[8px].w-full > svg (swoosh)
      h1.hidden.md:block.font-medium.text-[64px].leading-[90%].text-center          desktop H1
        "The platform behind great " span.relative.inline-block > span "restaurant teams"
                                        + div.absolute.-bottom-4.left-0.h-[10px] > svg.w-full.h-full (swoosh)
      p.font-medium.text-[16px].leading-[100%].text-center.pb-[40px].pt-[40px]      subtitle
      a (pill) w-fit mx-auto mb-[4px] h-12 px-4 rounded-full bg-royal-blue            CTA
      p.text-[11px].leading-[1.5em].text-center.text-[#6E6D6C].mb-[40px]            micro
    div.rounded-[20px].overflow-hidden                               media frame
      div.relative.group.w-full.h-full
        video.w-full.h-full.object-cover (autoplay loop muted playsinline preload=auto, no poster)
    div.pt-[40px].md:pt-[80px]                                       logo area
      p.md:hidden.font-medium.text-[18px].leading-[100%].text-center.mb-[20px]     "55K+ restaurants…"
      ul.grid.grid-cols-3.md:flex.md:flex-nowrap.md:justify-center.md:items-start.justify-items-center.items-start.gap-5.w-full.py-[10px]
        li.group.w-[120px].h-28.px-2.py-2.rounded-lg.flex.flex-col.items-center.justify-center.gap-2
           .opacity-70.mix-blend-luminosity.transition-colors.hover:opacity-100.hover:mix-blend-normal.hover:bg-stone-100.md:shrink-0   ×6
          a (block, 109.77×68)
            img.self-stretch.h-11.object-contain (109.77×44)
            div.px-3.py-0.5.rounded-[100px].inline-flex.justify-center.items-center.opacity-0.transition-opacity.group-hover:opacity-100
              span.text-black.text-xs.font-medium.leading-3.whitespace-nowrap "Read their story"
```
Aeon deviation: one `h1` whose size/swoosh switch at 810 px instead of two `h1` elements (single document heading; identical visuals).

## Computed styles (exact, 1440 unless noted)
| Element | Values |
| --- | --- |
| Section | bg #fff; border-radius 0 0 40px 40px; position relative; z-index 50; width 1440; height 1369.69 |
| Inner container | max-width 1200; margin 0 auto (120 px each side at 1440); padding **140 40 40** (≥1200), **80 40 40** (810–1199), **80 20 40** (<810) |
| Text block | width 1120; height 307.69 (28 + 115.19 + 96 + 48 + 4 + 16.5) |
| Eyebrow p | Nanum Pen Script 400; 28px / 28px (100%); center; black; box y 177 |
| H1 desktop (≥810) | font "medium" (7sans) → Geist; weight 500; **64px / 57.6px (90%)**; letter-spacing **-1.92px**; center; height 115.19 (2 lines); box y 205 |
| Swoosh span desktop | `relative inline-block`, 461.75 × 57.59 (line 2) |
| Swoosh desktop | `absolute -bottom-4 left-0 h-[10px]` → top 63.59 (6 px under the span box), width = span width, 10 px tall; `svg w-full h-full`, viewBox 0 0 391 22, preserveAspectRatio none, fill flame (#ff6808). Ink: text baseline at +50.5 px from span top; swoosh top ≈ **12.5 px below baseline** |
| H1 mobile (<810) | weight 500; **48px / 52.8px (110%)**; letter-spacing **-1.44px**; center; 3 lines at 390 (158.39), 2 lines at 768 (105.59) |
| Swoosh mobile | `absolute -bottom-2 left-0 h-[8px] w-full` → directly under the span box (top 52.8), 8 px tall; swoosh top ≈ **10.5 px below baseline** |
| Subtitle p | font "medium" → Geist 500; 16px / 16px; center; padding 40px 0; height 96 (1 line) / 112 at 390 (2 lines) |
| CTA a | display flex; width fit (179.66 for 7shifts' label); height 48; padding 0 16px; margin 0 auto 4px; radius 9999; bg #4570ff; color #fff; font "medium" 16px/24px 500; transition all 150ms cubic-bezier(0.4,0,0.2,1). Hover bg #3658c9 (shared PillButton) |
| Micro p | Inter Tight 400; 11px / 16.5px (1.5em); color #6E6D6C; center; margin-bottom 40 |
| Media frame | 1120 × 630 (16:9; height comes from the 16:9 video); border-radius **20px**; overflow hidden; no background, no shadow, no border. y 525 at 1440 |
| Video | width/height 100%; object-fit cover; max-width 100%; autoplay; loop; muted; playsinline |
| Logo area | padding-top **80** (≥810) / **40** (<810); height 212 at 1440 |
| "55K+" line (<810 only) | font "medium" 500; 18px / 18px; center; margin-bottom 20; 2 lines at 390 (36 tall), 1 line at 768 |
| ul | ≥810: flex, nowrap, justify-content center, align-items flex-start, gap 20; <810: grid 3 × 1fr (103.33 px cols at 390), justify-items center, gap 20. padding 10px 0. Height 132 (1 row) / 264 (2 rows) |
| li | 120 × 112; padding 8; radius 8; flex column, center/center, gap 8; opacity 0.7; mix-blend-mode luminosity; transition color/background-color/border-color/… 150ms cubic-bezier(0.4,0,0.2,1); flex-shrink 0 (≥810). Row at 1440: x = 310, 450, 590, 730, 870, 1010 (820 px wide, centred) |
| Logo img | 109.77 × 44; object-fit contain; resting ink luminance ≈ 112–130 (mid gray) |
| Caption pill | inline-flex; padding 2px 12px; radius 100px; **no background, no shadow**; opacity 0 → 1; sits 6 px under the logo (a is 68 px: 44 + 24 px line box) |
| Caption text | font "medium" 500; 12px / 12px; black; nowrap |

## States & behaviors
| Trigger | Element | Before | After | Transition |
| --- | --- | --- | --- | --- |
| hover li | li opacity | 0.7 | 1 | none (instant; `transition-colors` does not include opacity) |
| hover li | li mix-blend-mode | luminosity (logo gray) | normal (logo in colour) | instant |
| hover li | li background | transparent | stone-100 = lab(96.53 -0.1 0.36) ≈ **#f5f5f4** | 150ms cubic-bezier(0.4,0,0.2,1) (at 80 ms: alpha 0.68) |
| hover li | caption opacity | 0 | 1 | opacity 150ms cubic-bezier(0.4,0,0.2,1) |
| hover CTA | background | #4570ff | #3658c9 | 150ms (PillButton) |
| time | video | loops 38 s of restaurant scenes; each scene shows one white UI card (≈370 × 280 at 1120 frame width, radius ≈16, padding ≈32, title ≈17px medium, 12–13px body, navy #193f78 buttons, lime #c6ff94 status pills, sand segmented controls, 1px #eee bordered rows), placed beside the subject | — | cards animate inside the footage (typing, toggles, cursor clicks) |
| scroll | — | no scroll-driven behaviour | — | — |

### Aeon additions (requested by the brief)
- **Overlay cards** (HTML over the video, left ~35 % of the frame, where the footage is empty): enter with a staggered fade-up on mount (opacity 0 → 1, translateY 16 → 0, 600 ms cubic-bezier(0.22,1,0.36,1), delays 350 / 550 / 750 ms), then float 0 → −0.25em → 0 (≈4 px at 1440; 7 / 8 / 6.5 s ease-in-out, infinite, offset phases). Bars in card A grow from 0 (scaleX, 900 ms, delays 900 / 1020 ms). Card C's counter/bar wait 1.4 s, run 128 → 200 (5.2 s, ease-in-out), hold 1.4 s, then restart from 0 (rAF writing straight to the DOM; stops while paused or off-screen).
- **Card geometry** (em of the overlay font-size = `max(10px, 100cqw / 70)`, i.e. 16 px when the frame is 1120 wide): card = white, radius 0.875em, padding 1em, shadow `0 .75em 2em -.75em rgba(20,21,21,.3), 0 .125em .375em rgba(20,21,21,.08)`, Inter Tight; title 0.875em/600, caption 0.6875em stone, labels 0.75em. A: left 3em, top 3.25em, width 18.75em. B: left 6em, top 15em, width 18em (bordered inner row `#ecebe8`, radius 0.5em; red dot #ef4444 with 0.1875em halo). C: left 3em, top 24.5em, width 17em (spinner 0.75em, bar 0.375em). Below 640 px viewport (frame < 600 px) A and B are `visibility:hidden` (not `display:none`, so their entrance never restarts) and C moves to top 10 px / left 10 px at a fixed 11 px base, 13em wide, over the plant and wall, clear of the subject.
- **Pause control** (WCAG 2.2.2): 32 px round button bottom-right of the frame, hidden until the frame is hovered or the button is focused; toggles the video and the card animations. `prefers-reduced-motion: reduce` → video starts paused on the poster, counter static, CSS animations neutralised globally.
- **Video** pauses while the frame is off-screen (IntersectionObserver).

## Aeon content mapping
| 7shifts | Aeon |
| --- | --- |
| Eyebrow "More than just scheduling" | **More than rank tracking** |
| H1 "The platform behind great / restaurant teams" | **See how AI actually talks about / your pharma brand** (swoosh under "your pharma brand") |
| Mobile H1 (3 lines at 390) | Same sentence, 48 px, natural wrap. Geist is ≈5 % wider than 7sans, so "your pharma brand" (398 px) and "actually talks about" (414 px) cannot fit the 350 px column at 48 px; below 480 px the swoosh therefore sits under **"pharma brand"** (294 px) → 4 lines at 390 ("See how AI / actually talks / about your / pharma brand"). From 480 px it is under "your pharma brand" again (2 lines at 768: "See how AI actually talks about / your pharma brand") |
| Sub "7shifts gives operators…" | **Audit how ChatGPT, Claude, Gemini and Perplexity answer about your brand, by indication, market and audience.** |
| CTA "Get started, it's free!" → /signup | **Start your free report** → `START_HREF` |
| Micro "No credit card required" | **Free first scan. No credit card required.** |
| Video with baked-in UI cards | `/videos/hero-loop.mp4` (poster `/videos/hero-poster.webp`) + 3 HTML cards: **A "AI visibility"** (You 34 % royal, Competitor X 71 % stone, "Share of answers · last 7 days"), **B "Accuracy check"** (red dot, "2 answers state the wrong dose", "ChatGPT · Perplexity", "View"), **C "Scanning…"** ("Reading answers", "128 / 200", animated bar). Numbers are illustrative UI. |
| "55K+ restaurants have brought us into their back offices" (<810) | **Tracking answers across ChatGPT, Claude, Gemini, Perplexity and more** |
| 6 customer logos (img 110×44) | 6 text wordmarks: **ChatGPT, Claude, Gemini, Perplexity, AI Overviews, Copilot** (Geist 600, 20px, tracking -0.03em, #333 → 0.7 opacity ≈ the logos' resting gray; black on hover) |
| Hover caption "Read their story" → case study | **How we sample it** → `#faqs` |
| (none on desktop) | Small label **Tracking answers across** above the row (≥810 only), in 7shifts' micro-text style (11px/16.5px #6E6D6C), placed inside the 80 px top padding so the row keeps its exact y. Needed so the row cannot be read as a customer-logo wall. |

## Assets
- `/videos/hero-loop.mp4` — 1280×716, 8 s seamless loop, 24 fps, no audio (object-cover into 16:9 crops ≈3 px per side at 1120).
- `/videos/hero-poster.webp` — first frame poster.
- Composition: subject (marketer at a laptop) occupies x ≈ 34–100 % of the frame; face at 46–69 % x, 2–43 % y; left 0–34 % is blurred plant + wall → overlay cards live there.
- Swoosh: `UnderlineSwoosh` from `@/components/icons` (7shifts' exact path).
- No images for the engine row (text wordmarks only; no third-party logo files).

## Responsive behaviour
| | 1440 | 810–1199 | 768 (and <810) | 390 |
| --- | --- | --- | --- | --- |
| Container padding | 140 / 40 / 40 | 80 / 40 / 40 | 80 / 20 / 40 | 80 / 20 / 40 |
| H1 | 64px, 2 lines | 64px; line 1 balanced over 2 lines below ≈ 960 px | 48px, 2 lines | 48px, 4 lines |
| Swoosh | under "your pharma brand", 10 px, top 12.5 px below baseline (measured: identical rows to 7shifts) | same | under "your pharma brand", 8 px (≥480) | under "pharma brand", 8 px, 10.5 px below baseline (same as 7shifts) |
| Media | 1120 × 630 | (vw − 80) × 16:9 | (vw − 40) × 16:9 | 350 × 196.9 |
| Overlay cards | A, B, C at design size (1 em = 16 px at 1120 frame) | all three, scaled with the frame (container-query units) | all three, scaled, base floored at 10 px (viewport ≥ 640) | only card C, 11 px base, top-left |
| Engine area | pt 56 + label 16.5 + 7.5 = 80, flex row 820 px (li x = 310…1010, identical to 7shifts) | same; below 900 px the items may shrink so the 820 px row never overflows the page | pt 40, text line + 3 × 2 grid | same (no horizontal overflow at 360–1440, scrollWidth = viewport) |

## Narrow-viewport safeguards (Aeon only; no visible change at 390 and above)
- H1 font-size `min(48px, 13.4vw)` with tracking `-0.03em` (so -1.44px at 48, -1.92px at 64): only shrinks below 358 px so "pharma brand" fits the column (42.9 px at 320).
- Engine wordmarks `min(20px, 5.34vw)`: only shrink below 375 px so the 3-column grid never lets two names touch.
- Caption pill horizontal padding 2 px instead of 7shifts' 12 px (the pill has no background, so it looks the same): each link stays within its 120 px tile; with 12 px the right column poked 1.5 px past a 320 px viewport.
- Mobile scan card base `min(11px, 100cqw / 32)`.
- Section has `overflow-x: clip` as a guard; `document.documentElement.scrollWidth` equals the viewport at 320 / 340 / 360 / 375 / 390 / 430 / 768 / 810 / 1024 / 1440.

## Verification (Aeon vs 7shifts, section-relative, 1440)
Section 1369.69 = 1369.69 · eyebrow y 140 = 140 · H1 168 / 115.19 = 168 / 115.19 · swoosh y 289.19 ≈ 289 · subtitle 283.19 · CTA 379.19 (190.44 wide vs 179.66: longer label) · micro 431.19 · media 487.69, 1120 × 630 · engine area 1117.69 · ul 1197.69 · li x 310 / 450 / 590 / 730 / 870 / 1010. At 390 every block starts at the same offset; the section is 68.8 px taller only because the H1 wraps to 4 lines (+52.8) and the subtitle to 3 (+16).

## Known asset issue
`public/videos/hero-loop.mp4`: the first clip rendered the subject's fingers bright orange from ≈2.0 s to ≈5.5 s (generation artifact). Fixed by regenerating the loop with Kling 3.0 pro (same start/end frame, prompt pinning natural skin tone); the new clip is 1280x716, 8 s, 190 KB.
