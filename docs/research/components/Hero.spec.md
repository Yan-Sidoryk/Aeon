# Hero (+ AI-engine strip) — component spec

## Overview
- **Reference:** https://www.7shifts.com/ — first child of `.traffic-warden-root` (wrapper `div.bg-white.rounded-b-[40px].z-50.relative`), page y = 37, height 1369.69 px at 1440.
- **Product-led (Sep 2026 rework):** the CTA is onboarding Screen 1 (`docs/user-journey-pharma-onboarding.md`: type your company website, "Scan my brands") and the 1120 × 630 media frame shows the product itself (first scan → report) instead of a stock video with floating cards. The AI engines are shown with their real logos.
- **Target files:**
  - `src/components/Hero.tsx` — `export function Hero()` (server component, section shell + text block)
  - `src/components/hero/HeroForm.tsx` — website form (server component, plain GET form, no JS)
  - `src/components/hero/ProductMock.tsx` — product preview in the media frame (server component, CSS-only motion)
  - `src/components/hero/Hero.module.css` — the preview's keyframes and state classes
  - `src/components/hero/EngineStrip.tsx` — engine logo row (replaces 7shifts' customer-logo row)
  - `src/components/hero/hero.content.ts` — typed copy, including every label and number in the preview
- **No client JS in the hero.** Everything renders on the server; the preview animates with CSS from first paint.
- **Section slug:** `data-section="hero"`.
- **7shifts reference screenshots** (`docs/design-references/hero/`): `7s-hero-1440.jpg`, `7s-hero-768.jpg`, `7s-hero-390.jpg`, `7s-logos-rest-1440.jpg`, `7s-logos-hover-1440.jpg`, plus `docs/design-references/7s-01-hero.jpeg`, `7s-mobile-01-hero.jpeg`.

## 7shifts breakpoints (read from their CSS, not Tailwind defaults)
`md` = **810 px**, `lg` = 1024 px, `xl` = **1200 px** (others: 376, 567, 1374, 1536). `globals.css` defines these, so the hero uses 7shifts' `md:` / `xl:` classes as-is.
Aeon extras: `min-[480px]` (swoosh phrase), `sm` = 567 px (form goes inline), **container** `720px` (frame switches from the mobile to the desktop product preview), `min-[900px]` (engine items stop shrinking).

## DOM structure (7shifts → Aeon)
```
div.bg-white.rounded-b-[40px].z-50.relative                         → section[data-section=hero] (same classes + overflow-x-clip)
  div.pt-[80px].px-[20px].pb-[40px].md:px-[40px].max-w-[1200px].mx-auto.xl:pt-[140px]   (same)
    div                                                              text block
      p eyebrow (Nanum Pen Script 28px)                              same
      h1 (48px mobile / 64px desktop, swoosh)                        same (one h1, see below)
      p subtitle (16px, py 40)                                       same
      a pill CTA (h 48) + p micro (11px, mb 40)                      → HeroForm: form (field + "Scan my brands") + micro line with walkthrough link, wrapper mb 40
    div.rounded-[20px].overflow-hidden > video                       → ProductMock: div.@container.rounded-[20px].overflow-hidden (periwinkle panel)
                                                                        p.sr-only (description)
                                                                        div[aria-hidden] desktop stage (aspect 1120/630)
                                                                        div[aria-hidden] mobile window
    div.pt-[40px].md:pt-[80px] > p.md:hidden + ul > li×6 (logo img)  → EngineStrip: same geometry, BrandLogo artwork
```
Aeon deviation: one `h1` whose size/swoosh switch at 810 px instead of two `h1` elements (single document heading; identical visuals).

## Computed styles (7shifts, exact, 1440 unless noted)
| Element | Values |
| --- | --- |
| Section | bg #fff; border-radius 0 0 40px 40px; position relative; z-index 50; width 1440; height 1369.69 |
| Inner container | max-width 1200; margin 0 auto (120 px each side at 1440); padding **140 40 40** (≥1200), **80 40 40** (810–1199), **80 20 40** (<810) |
| Eyebrow p | Nanum Pen Script 400; 28px / 28px (100%); center; black |
| H1 desktop (≥810) | Geist 500; **64px / 57.6px (90%)**; letter-spacing **-1.92px**; center; 2 lines (115.19) |
| Swoosh desktop | `absolute -bottom-4 left-0 h-[10px]`, full span width; `svg` viewBox 0 0 391 22, preserveAspectRatio none, fill flame (#ff6808); top ≈ 12.5 px below the baseline |
| H1 mobile (<810) | 500; **48px / 52.8px (110%)**; letter-spacing **-1.44px**; center |
| Swoosh mobile | `absolute -bottom-2 left-0 h-[8px] w-full`; top ≈ 10.5 px below the baseline |
| Subtitle p | Geist 500; 16px / 16px; center; padding 40px 0 |
| CTA a | flex; h 48; px 16; radius 9999; bg #4570ff → #3658c9 hover; Geist 16px/24px 500; transition all 150ms cubic-bezier(0.4,0,0.2,1) |
| Micro p | Inter Tight 400; 11px / 16.5px; #6E6D6C; center; margin-bottom 40 |
| Media frame | 1120 × 630 (16:9); border-radius **20px**; overflow hidden |
| Logo area | padding-top **80** (≥810) / **40** (<810) |
| "55K+" line (<810 only) | 500; 18px / 18px; center; margin-bottom 20 |
| ul | ≥810: flex, nowrap, center, gap 20; <810: grid 3 × 1fr, justify-items center, gap 20. padding 10px 0 |
| li | 120 × 112; padding 8; radius 8; flex column center, gap 8; opacity 0.7; mix-blend-mode luminosity; flex-shrink 0 (≥810). Row at 1440: x = 310, 450, 590, 730, 870, 1010 |
| Logo img | 109.77 × 44; object-fit contain; resting ink luminance ≈ 112–130 (mid gray) |
| Caption | inline-flex; no background; opacity 0 → 1 on hover; Geist 500 12px/12px black, 6 px under the logo |

## Aeon: website form (`HeroForm.tsx`)
- `<form action="/start" method="get">` (`START_HREF`), one field `name="website"` → `/start?website=acmepharma.com`. Works without JS; `/start` normalises the domain.
- Field: `input#hero-website` `type="text" inputMode="url" autoComplete="url" autoCapitalize="none" autoCorrect="off" spellCheck=false enterKeyHint="go" required`, placeholder **acmepharma.com**, 16px Inter Tight (no iOS zoom), globe icon (lucide `Globe`, 18px, stone) at left 16. Label **Your company website** is `sr-only` and tied by `for`.
- Button: shared `PillButton` (`type="submit"`): h 48, Geist 16px/24px 500, royal → royal-dark, focus ring royal; label **Scan my brands**.
- **≥ 567 px (sm):** inline. Form = rounded-full, 1px oat border, white, padding 4, shadow `0 1px 2px rgba(20,21,21,.04), 0 6px 20px -8px rgba(20,21,21,.14)`, max-width 480 (480 × 58 at 1440; input 306 wide, button 160). Focusing the input turns the whole pill's border royal with a 4px `rgba(69,112,255,.16)` ring (`has-[input:focus-visible]`).
- **< 567 px:** input and button stack full width (48 + 8 + 48), the input has its own rounded-full oat border and focus ring.
- Under it (mt 12, 24 px tall line): micro **Free first scan. No credit card required.** (11px/16.5 stone) and link **or book a walkthrough** → `WALKTHROUGH_HREF` (12px, 500, black, oat underline → black on hover, 24 px tall target), wrapping centred.
- Geometry at 1440 (section-relative): form y 379.19, micro line 449.19, frame 513.19 (7shifts: CTA 379.19, frame 487.69 — the form is 10 px taller than the pill and the micro line 7.5 px taller).

## Aeon: product preview (`ProductMock.tsx`)
**Frame:** `@container`, radius 20, overflow hidden, panel `linear-gradient(155deg, #d6e0ff 0%, #dcdcff 52%, #e9dcff 100%)` (periwinkle → lavender). Decorative: both compositions are `aria-hidden`; a `sr-only` paragraph describes it. Brand, competitor and all numbers are placeholders from `hero.content.ts`.

**Two compositions, switched by the frame width (container query at 720 px):**
- **Desktop stage (frame ≥ 720 px):** `aspect-[1120/630]`, `--spacing: calc(100cqw / 1120)` so every spacing utility is one design px (1:1 at 1440, 0.65 at 768/810) and the app window scales like a screenshot. Font sizes are `calc(var(--spacing) * N)`; the stage sets a scaled base font (13 units, leading 1.3) so inherited line boxes scale too.
- **Mobile window (frame < 720 px):** single column in real px with `--spacing: min(1px, 100cqw / 350)` (only shrinks below a 350 px frame, i.e. 320 px viewports); height follows content (418.5 at 390).
- The inactive composition is `invisible` + absolutely positioned, **never `display:none`**: a display toggle restarts CSS animations (seen when Playwright relayouts for a beyond-viewport element screenshot, or on a resize across 720 px). Mobile engine columns 4–5 use 0 px tracks + `@max-[…]:invisible` for the same reason (and never force `visible`, which would override the inherited `invisible`).

**Desktop layout (design px on the 1120 × 630 stage):**
- App window: top 52, left/right 56, bottom −24 (bleeds off the frame), radius 14, white, shadow `0 0 0 1px rgba(25,63,120,.07), 0 2px 4px rgba(25,63,120,.05), 0 14px 32px -10px rgba(25,63,120,.2), 0 40px 80px -32px rgba(25,63,120,.32)`.
- Top bar (52 tall, px 18, bottom border #edece8): `AeonLogo` mark 22 · divider · brand chip (lavender "A" tile 22, **Brand A** 13/600 + " · Atopic dermatitis" stone, chevron) · tabs **Overview** (sand pill, active) / Prompts / Accuracy (+ red badge "2") / Fixes (+ royal badge "3") · status chip (**Scanning** with spinner → **Scan complete** with check, green #067647 on #ecfdf3) · **Share** outline button.
- Main column (708 wide, px 24, pt 22): **First scan** (Geist 16/600) + "40 prompts · 5 engines · US · English"; audience segmented control (All / Patient / Caregiver / HCP). Counter tiles (4 × ~157, radius 10, border #eceae5): **Answers read** 200/200 (royal progress bar), **Mentions of you** 34% (royal, bar 34%), **Competitor X** 71% (bar 71%, taupe), **Accuracy issues** 2 (turns red #d92d20 on a #fef3f2 tint when the first issue lands; note "Checked against the label"). Values Geist 24/600 tabular.
- Grid: columns `1fr repeat(5, 84)`; header 32 tall with colour engine logos (`BrandLogo` chatgpt, claude, gemini, perplexity, google, 14 px) + names (11/500); 6 rows × 50 (prompt 13/500 truncated + audience tag 10/500: Patient periwinkle/royal-dark, Caregiver lavender/eggplant, HCP mint 15%/forest). Cells: skeleton (50 × 18, #efeee9, shimmer) → pill 22 tall 11/600: **You** royal 12%/royal-dark, **Comp. X** stone 10%/graphite, **—** taupe, **Wrong dose** #fee4e2/#b42318 (row 2, ChatGPT).
- Report rail (300 wide, offwhite, left border, px 20, pt 20): eyebrow **AI VISIBILITY REPORT**. While scanning: "Building your report…" + skeleton blocks. Done: **You 34 · Competitor X 71** (Geist 34/600, royal / black) with two bars; "AI recommends Competitor X twice as often."; red box (#fef3f2, border #fecdca, radius 10) **2 answers state the wrong dose** with the ChatGPT sentence ("Take [brand] **200 mg twice daily**.", red highlight) above the FDA label sentence ("The recommended dose is **100 mg once daily**.", green highlight); **Top fixes** 1–3 with **Fix this** buttons (first royal, others royal 10%).

**Mobile layout (px at a 350 frame):** frame padding 16/14; window radius 12, bleeds 14 px off the bottom. Top bar 40: mark, "A" tile, **Brand A** · Atopic dermatitis (truncates), status chip. Two score tiles **You 34** / **Competitor X 71** (Geist 24, bars); a line that shows **Reading answers 0 → 200/200** (spinner, progress bar) during the scan and becomes the red **2 answers state the wrong dose** alert when done; grid with 4 prompts (11.5/500, wraps) × 3 engines (logo 14 + name 9) at 58 px columns, 4 engines ≥ 480 px frame, 5 ≥ 600. "Wrong dose" wraps to two lines below 480.

**Timeline (ms from first paint; one run ≈ 6.7 s, then static — no idle loop):**
| t | What happens |
| --- | --- |
| 0 | Skeleton grid (diagonal shimmer, 1.1 s × 5), counters at 0, "Scanning" spinner (0.8 s × 7), rail "Building your report…" |
| 300 → 4600 | Counters count up (`@property --n` integer, cubic-bezier(0.3,0.1,0.3,1)); bars grow in step (scaleX) |
| 500 + row × 680 + jitter (0–380) | Cells land top-to-bottom, engines unevenly: skeleton fades (260 ms), pill pops (380 ms, scale .8 → 1, slight overshoot). Last cell ≈ 4230 |
| 1180 | **Wrong dose** flag lands (scale .6 → 1.12 → 1, 520 ms) and pulses once (2px red ring, scale 1 → 1.3/1.9, fades, 1.1 s from 1560); Accuracy issues 0 → 1, tile turns red |
| 3900 | Accuracy issues 1 → 2 (one `steps(2)` animation whose edges fall on 1180 and 3900) |
| 5000 | "Scanning" → **Scan complete**; rail skeleton fades out |
| 5100 → 6570 | Report rises in (opacity + translateY 10 → 0, 560 ms): scores 5100, bars + takeaway 5220 (bars grow 900 ms from 5260), red box 5420, tab badges pop 5250 / 5350, Top fixes 5620, fix rows 5700 / 5810 / 5920 |

Every class's base style is the finished frame; animations reach back from it (`animation-fill-mode: both` + per-element `--d`). So no-JS, `prefers-reduced-motion: reduce` (module sets `animation: none !important` under `.motion`) and a completed run all show the same final state. Only opacity/transform animate (plus the integer counters). The run plays on page load, including when the hero is off-screen.

## Aeon: engine strip (`EngineStrip.tsx`)
- 7shifts geometry unchanged (row x = 310 … 1010 at 1440; 3 × 2 grid below 810).
- Items (`BrandLogo`): **ChatGPT** (mono icon 20 + "ChatGPT" Geist 600 17px, -0.03em), **Claude** wordmark (h 22), **Gemini** wordmark (h 24), **Perplexity** wordmark (h 21), **AI Overviews** (mono Google "G" 20 + text), **Copilot** wordmark (h 25). Sizes use `min(Npx, …vw)` so they shrink below ~390 px and never touch at 320.
- Treatment: black artwork at **opacity 0.55** (≈ 7shifts' grey logos); hover/focus-within → opacity 1 + #f5f5f4 tile + caption **How we sample it** → `#faqs` (opacity and background transition 150 ms cubic-bezier(0.4,0,0.2,1)). Accessible names: wordmark `alt` = engine name; icon + name uses `alt=""` and the visible text.
- Label **Tracking answers across** above the row (≥ 810, 11px stone, inside the 80 px top padding); mobile line **Tracking answers across ChatGPT, Claude, Gemini, Perplexity and more** (<810).

## Aeon content mapping
| 7shifts | Aeon |
| --- | --- |
| Eyebrow "More than just scheduling" | **More than rank tracking** |
| H1 "The platform behind great / restaurant teams" | **See how AI actually talks about / your pharma brand** (swoosh under "your pharma brand"; under "pharma brand" below 480 px, 4 lines at 390) |
| Sub "7shifts gives operators…" | **Audit how ChatGPT, Claude, Gemini and Perplexity answer about your brand, by indication, market and audience.** |
| CTA "Get started, it's free!" → /signup | Website field + **Scan my brands** → `GET /start?website=…` |
| Micro "No credit card required" | **Free first scan. No credit card required.** + **or book a walkthrough** → `WALKTHROUGH_HREF` |
| Video with baked-in UI cards | Aeon app window: live first scan → AI visibility report (above) |
| Customer logos + "Read their story" | AI-engine logos + **How we sample it** → `#faqs` |

## Responsive behaviour
| | 1440 | 810–1199 | 768 (and 720–809 frame) | 390 | 320 |
| --- | --- | --- | --- | --- | --- |
| Form | inline pill 480 × 58 | same | same | stacked, full width (350) | stacked (280) |
| Preview | desktop stage 1120 × 630 (1:1) | desktop stage, scaled | desktop stage at 0.65 (728 × 410) | mobile window, 350 × 418.5, 3 engines | mobile window scaled 0.8 (280 × 335) |
| Engine area | flex row, label above | same | 3 × 2 grid + line | same | same, logos shrink |
Section height: 1395.19 at 1440 (7shifts 1369.69; +25.5 from the taller form and micro line), 1445.69 at 390, 1251 at 768.

## Verification
- `document.documentElement.scrollWidth` equals the viewport at 320 / 390 / 768 / 1440; no hero element outside the viewport.
- All hero animations report `finished` by 7.5 s; reduced motion → 0 animations, counters at final values, "Scan complete" visible.
- Enter in the field navigates to `/start?website=acmepharma.com`.
- No console errors or warnings.

## Assets
- No raster assets. Engine artwork: `/public/logos/*.svg` via `BrandLogo` (see `third_party/LOGOS.md`); Aeon mark via `AeonLogo`; icons from lucide-react (`Globe`, `Check`, `ChevronDown`, `CircleCheck`, `Share2`, `TriangleAlert`).
- Now unused by the hero: `/public/videos/hero-loop.mp4`, `/public/videos/hero-poster.webp` (and their `assets-src/` sources).
