# PlatformMocks: product-UI panels for the platform section

Target file: `src/components/platform/PlatformMocks.tsx` (exports `TrackMock`, `VerifyMock`, `FixMock`, `ReviewMock`, `MeasureMock`)
Helpers: `src/components/platform/mocks/` (`MockFrame.tsx` client root, `parts.tsx` shared UI atoms, `mocks.module.css` keyframes)
Reference: https://www.7shifts.com/, section index 1 (platform), left half of each of the 5 sticky cards.
Screenshots: `docs/design-references/platform-mocks/` (rest frames at 1440, 400 ms time-lapses, mobile 390).

## 1. Overview

On 7shifts, each card's left half is a 520x520 panel (desktop) or a 350x350 panel (mobile, full card width).
Four of the five are **Lottie animations** (SVG renderer, `preserveAspectRatio="xMidYMid meet"`), and one is a static image:

| # | 7shifts tab | Panel | Source | Comp | Loop |
|---|---|---|---|---|---|
| 1 | Hire | `#D6E0FF` (Lottie BG layer; the div behind it is `#DAD8FF`) | `lotties/hiring/bg/hiring-animation-bg.json` | 1080x1080, 30 fps, frames 15-210 | 6.5 s |
| 2 | Train | `#E2DED6` | `train-tile-desktop.webp` (mobile: a separate 350x239 crop) | static | none |
| 3 | Schedule | `#FF6808` (solid layer) | `json-files/scheduling.json` | 1000x1000, 23.976 fps, 120.65 frames | 5.03 s |
| 4 | Pay | `#244F47` (solid layer) | `json-files/payroll.json` | 1000x1000 (1120 precomp), 23.976 fps, 150.8 frames | 6.29 s |
| 5 | Retain | `#4570FF` (solid layer) | `json-files/employee-engagement.json` | 1000x1000 (1120 precomp), 23.976 fps, 150.8 frames | 6.29 s |

The Lotties autoplay and loop. Because they are SVG with `meet`, the whole picture (text included) scales uniformly with the
panel: at 350 px everything is 0.673x of the 520 px version (row text ~7 px). Aeon reproduces this with a CSS "stage".

Aeon keeps the panel colour rhythm in order: Track `#D6E0FF` periwinkle, Verify `#E2DED6` oat, Fix `#FF6808` flame,
Review `#244F47` forest, Measure `#4570FF` royal.

## 2. DOM structure (Aeon)

```
div[data-mock=track|verify|fix|review|measure][aria-hidden=true]      MockFrame (client): relative h-full w-full aspect-square
  │                                                                  overflow-hidden, container-type:size, owns panel bg
  └─ div  "stage"   absolute, centred, size = 100cqmin (square), --spacing = 100cqmin/520
       └─ absolutely positioned cards on a 520-unit grid (Tailwind spacing utilities, 1 unit = 1 px at 520)
```

- The stage mimics SVG `meet`: square, centred, scaled to the smaller side of the box. Because Tailwind v4 spacing
  utilities compile to `calc(var(--spacing) * n)`, redefining `--spacing` on the stage makes every `w-*`, `h-*`, `p-*`,
  `gap-*`, `top-*`, `left-*`, `translate-*` a design unit. Font sizes and radii use
  `text-[length:calc(var(--spacing)*n)]` / `rounded-[calc(var(--spacing)*n)]`. Bare spacing values must be multiples of 0.25.
- Elements that bleed off the panel on 7shifts (Hire table, Train table) are drawn longer than the stage so they are still
  cut by the root's `overflow-hidden` when the box is taller than wide.
- The five mocks are Server Components; only `MockFrame` is a client component (one `useEffect`, no React state).

## 3. Extracted styles (7shifts, in 520-box px)

Values computed from the Lottie vectors at the resting frame (group bounding boxes, rounded-rect vertex chords, glyph
boxes), cross-checked against 1440 screenshots.

### Shared language
- White cards, **no shadow** in the Lottie panels. Train image: big card `0 4px 24px rgba(0,0,0,.10)`, modal `0 4px 20px rgba(0,0,0,.08)`.
- Row fill `#FBFAF8`; input/chip border `1px #F1F0EC`; separators `#EBEBEB` (schedule) / `#EFEFED` 2px (train).
- Primary button navy `#193F78`, white text, radius 4.8, press = scale 1 → 0.95 → 1 in 5-6 frames (~200 ms).
- Accent fills: lime `#C6FF94` (success, selected), periwinkle `#D6E0FF`, lavender `#EBDCFF`, violet toggle `#C293F1`,
  toggle off `#E3DED6`, icon blue `#4E72F6`, progress `#FF6808` on `#F3F3F2`, avatar-less icon red `#FA596D` (Train PDF).
- Type: a neo-grotesque with x-height/cap = 0.75 (same ratio as Inter Tight). Matching cap heights with Inter Tight
  (cap = 0.7275 em) gives: pop-up 17.5 px / line 21.8 px; card title 13.3 px; row text 10.45 px; column labels and button
  text 9.3 px (labels at `rgba(0,0,0,.75)`); Retain chips ~9 px, date line ~9.5 px; Schedule/Pay details 6-8 px.
- Cursor: white arrow, black 1.3 px outline, round joins, 13.2 x 17.9. Path (tip at 0,0, raw units):
  `0,0 3.75,35.47 10.35,25.57 16.37,36.34 22.24,32.34 15.46,22.7 26.79,21.42` scaled x0.493.
- Click: Hire rotate 0 → -7° → 0 in 4 frames @30 fps; Schedule/Pay/Retain rotate -13° + scale 0.967 in 3+3 frames @24 fps.

### Card 1: Hire (resting frame)
| Element | Geometry (x, y, w, h) | Style |
|---|---|---|
| Success pop-up | 124.8, 41.2, 270.5 x 143.6 | white, r 12.5 |
| Lime circle | 238.1, 60, 43.8 x 43.8 | `#C6FF94`; check black 19.5 x 14.1, ~2.4 stroke, drawn by a trim-path matte |
| Pop-up text | 2 lines centred, caps at y 121.0, baselines 133.8 / 155.6 | 17.5 px, line 21.8 |
| Table card | 31.6, 223.3, 457.1 x ≥330 (bleeds off bottom) | white, r 20 |
| Title "Your job postings" | x 57.5, cap top 259.5 | 13.3 px |
| Navy button | 370.3, 250.4, 92.4 x 27.4 | `#193F78`, r 4.8, 9.3 px white |
| Column labels | caps at y 308, x 72.2 / 223.1 / right 447.7 | 9.3 px, 75% black |
| Rows (4) | x 57.3, y 330.2 + 50.1·i, 405.4 x 45.3 (gap 4.8) | `#FBFAF8`, r 4.8 |
| Pin icon | x 74.2, 11.5 x 14.6 | outline `#4E72F6` |
| Row text | x 93.5 and 221.7, caps 7.6 | 10.45 px black |
| Toggle | 412.6, 35.8 x 19.1, knob 16.7 inset 1.2 | on `#C293F1`, off `#E3DED6` |
| Cursor rest | tip at 292.3, 371.7 | |

### Card 2: Train (static)
Big card `#FBFAF8` x 34, y 59 → 460, bleeds right, r 20, shadow; header 13 px dark, rows 13 px `#6E6D6C`,
2 px `#EFEFED` rules every 64 px. Modal white 104, 177, 320 x 180, r 14, shadow; title 17 px centred; label "Document"
11 px `#868686`; file row 130, 266, 268 x 65, `#E5FFCF` + 1 px `#C6FF94`, r 6; red icon `#FA596D` 30 x 30, r 5;
check box `#C6FF94` 23 x 23, r 4, check `#244F47`.

### Card 3: Schedule (resting frame)
Big card 46.9, 193.2, 423.5 x 240.5, r 12.4. Editor card 154.6, 83.1, 216.3 x 160.3, r 11.7, overlapping the big card by 50.
Inputs `#FBFAF8` + 1 px `#F1F0EC`; day pills 17.6 x 17.1 (selected lime); Save 145.5 x 18 navy. Active day column
`#FBFAF8` 98.2 x 148 with a flame top bar 3.4 high. Shift pills 86.1 x 21.1 in lime / lavender / periwinkle.

### Card 4: Pay (resting frame)
Card 34.7, 127.6, 450.3 x 264.9, r 10.2. Progress track 46.9, 142.5, 429 x 5.8 `#F3F3F2`, fill `#FF6808`, pill ends;
step labels ~5 px at 50%. Title ~10 px + navy button 53.2 x 19.6. Stat pills (periwinkle / lime / lavender) ~17 high.
Rows `#FBFAF8` 425 x 38.7, gap 2.6; avatars 18.

### Card 5: Retain (resting frame)
Card 121.6, 86.2, 272.9 x 342.2, r 9, padding ~19. Title 2 lines centred (caps ~9.5 → 13 px); date line 9.5 px;
5 smileys 31 px (pitch 48.8, selected lime); chips h 26.1 pill, `#FBFAF8` + 2 px `#F1F0EC` (selected lime), gap 6.8;
full-width navy button 235.7 x 31.7, 8 px text.

## 4. States and animations

### 7shifts Hire loop (30 fps, t = seconds from loop start)
| t | Event | Easing |
|---|---|---|
| 0.00 | Hard cut to "Create Job Posting" modal over the table (table dimmed by a 20% black overlay) | |
| 0.80 → 1.10 | Cursor appears, moves to the "Hiring alerts" toggle | cubic-bezier(.33,0,.67,1) |
| 1.13 → 1.27 | Click wiggle (rotate -7°); toggle knob slides, colour `#E3DED6` → `#C293F1` | |
| 1.47 → 1.83 | Cursor moves to Save | cubic-bezier(.33,0,.67,1) |
| 2.00 → 2.17 | Click; Save scale 1 → .95 → 1 | |
| 2.10 → 2.23 | Modal scales to 0, overlay fades | |
| 2.23 → 3.03 | Table slides down 103 px; new top row fades in; lower rows shift 50 px | cubic-bezier(.07,0,0,1) |
| 2.57 → 3.07 | Success pop-up scale 0 → 1.05 → 1 | |
| 2.90 → 3.23 | Check mark draws | cubic-bezier(.33,0,.67,1) |
| 3.23 → 6.50 | Hold, then loop | |

Schedule (5.03 s): cards grow in (0.63 s), cursor clicks 2 days and Save, three shift pills pop 0 → 1.05 → 0.95 → 1
(0.42 s each, 125 ms stagger). Pay (6.29 s): cursor clicks through three steps, each step slides up 37 units and the
progress bar grows; a "Calculating…" modal with a 44% backdrop. Retain (6.29 s): cursor clicks a smiley and three chips
(each pops from 1.04 → 1 in 0.29 s), then Submit; "Submitted" pop-up 1 → 1.08 → 0.92 → 1 over a 30% backdrop.

### Aeon behaviour
Trigger: one `IntersectionObserver` per mock (threshold 0.45), fires once. `MockFrame` writes `data-state` on the root:
unset (server render, no JS, reduced motion, or already on screen at hydration) = final frame; `armed` = entrance targets
hidden; `play` = entrance runs. Stagger delays are `--d` custom properties. Loops start after the entrance and are the
only infinite animations; all motion is transform / opacity / stroke-dashoffset. Under `prefers-reduced-motion` the frame
is never armed and loop delays are zeroed (globals already shorten durations), so each loop settles on its rest pose.

| Mock | Entrance (from play) | Loop (one per mock) |
|---|---|---|
| Track | Table card fades in at its pre-slide position (y −103), rows rise with 60 ms stagger, then the card slides down 0.8 s `cubic-bezier(.07,0,0,1)` while the pop-up scales 0 → 1.05 → 1 (0.5 s) and the check draws (0.33 s); share-of-voice bars fill (0.8 s) | Cursor drift over the rows with click wiggles, 6.5 s (Hire cadence) |
| Verify | Backdrop card rises; modal fades/zooms 0.96 → 1; comparison rows rise; red/green highlights sweep in (scaleX); ✕/✓ boxes pop; chips pop with 100 ms stagger | Pulsing ring on the red alert icon, 2 s |
| Fix | Document card zooms 0.94 → 1; lines rise; claim chips pop 0 → 1.05 → 0.95 → 1 with 125 ms stagger (Schedule shift pills); schema badge pops; blocked line strikes through; toast drops in with overshoot | Blinking text caret, 1.1 s steps |
| Review | Card rises; progress fills to 88% (1 s); pills pop; rows rise (90 ms stagger); lime check circles pop | Cursor enters, clicks "Approve" (button presses 0.95), leaves; 5 s |
| Measure | Card rises; grid fades; line draws via `stroke-dashoffset` (1.3 s); points pop along it; "Fix published" marker appears when the line reaches it; "+18 pts" pops 1 → 1.08 → 0.92 → 1 (Retain "Submitted"); before/after chips rise | Pulsing ring on the latest point, 2 s |

## 5. Aeon content mapping

| 7shifts | Aeon | Notes |
|---|---|---|
| Hire: "Your job opening is ready to share!" pop-up | Track: lime check + "Scan complete" / "40 prompts × 5 engines" | same 270.5 x 143.6 card |
| Hire: "Your job postings" table, Location / Position / Open, pins, toggles, navy button | "Who AI recommends": Prompt · ChatGPT · Claude · Gemini · Perplexity; prompt icon in `#4E72F6`; cells are pills "You" (royal tint), "Comp. X" (stone tint), "—"; the button slot holds the share-of-voice pair "You 34" / "Competitor X 71" | 4 rows, the 4th cut by the panel edge as on 7shifts |
| Train: course table + "Upload your SOPs" modal with lime file row | Verify: answer log table behind; modal = alert "2 AI answers state the wrong dose" (red `#FA596D` icon), "AI answer · ChatGPT" row (red tint, "300 mg twice daily" highlighted), "Label · Section 2.1" row (lime, "150 mg once daily" highlighted), chips "Dose ✕", "Indication ✓", "Boxed warning ✓" | ✓ box keeps Train's `#244F47` check |
| Schedule: shift editor over the schedule card, flame-topped active column, pastel shift pills, navy Save / Publish | Fix: toast "Unreferenced claim blocked" (lock) over the document card "Draft: How is [brand] dosed?"; "Direct answer" block = the flame-topped `#FBFAF8` column; claim chips "PI §2.1", "PI §5.3" (periwinkle); "FAQPage schema" badge (lavender); navy "Send to review" | blocked sentence shown struck through in the draft |
| Pay: progress + step labels, title + navy button, stat pills, table rows with avatars | Review: progress (Claims / Fair balance / Sign-off), "Pre-MLR review" + reviewer avatars "MA", "RL"; pills "Risk score: Low" (lime) + page pill (lavender); rows "Claims matched 12/12", "Fair balance", "ISI present and current", "Banned phrases: 0" with lime check circles; buttons "Export to Veeva PromoMats" (outline) + "Approve" (navy) | |
| Retain: centred portrait card, title, date line, smiley row, chips, full-width navy button | Measure: "Share of voice · [brand]", "Last 8 weeks · 4 AI engines", 8-week SVG line chart (flat, then rising after a dashed "Fix published" marker), "+18 pts" lime pill, "Before 34% → After 52%" chips, navy "Share report" | card widened 273 → 300 for the chart |

Honesty: every number is illustrative UI; names are placeholders ("[brand]", "Competitor X"), no real drugs or companies.

## 6. Responsive behaviour

- Box = the platform card's panel: 520x520 at 1440, `aspect-square` in `PlatformSection`, 350x350 at 390 (mobile), anything
  from ~320 to ~620 in between. The stage scales everything uniformly (0.615x at 320, 1.19x at 620), exactly like the Lottie.
- If the box is not square (e.g. a stretched flex item at tablet widths) the stage stays square and centred; the root's
  background colour fills the rest and bleeding cards stay cut by the root edge.
- No breakpoint-specific layouts; 1 px borders stay 1 px.

## 7. Build notes

Verified against the shared dev server at 1440 (520 box), 1100 (490), 900 (390 x 535-594, non-square), 660 (620),
390 (350) and 360 (320), in place in the sticky stack, and with `prefers-reduced-motion`. Track's geometry is within
0.25 px of the Lottie (pop-up 124.75/41.25/270.5x143.5, table 31.5/223.25/457, rows 330.25 + 50·i, 405.5 x 45.25).

Deliberate deviations from the 7shifts panels:
- Lottie text is outlined glyphs in 7shifts' own grotesque; Aeon uses Inter Tight 500 at cap-height-matched sizes.
- Loops are single micro-animations (the brief), not full scripted scenes: no modal/backdrop replay as in Hire, Pay and
  Retain. The Hire choreography (table slide + pop-up + check draw) is reproduced once, as Track's entrance.
- Content-driven sizes: Verify's modal is 218 high (Train 180); Fix's document card is 296 high at y 131 (Schedule card
  240.5 at y 193) and its top card is a 236 x 52 toast; Review's card is 330 high with a button footer (Pay 265);
  Measure's card is 300 wide (Retain 273) for the chart.
- Floating toast (Fix) carries a soft shadow to separate white-on-white, as the Train modal does.

Maintenance gotchas:
- `cn()` (tailwind-merge) drops a `leading-*` that comes before a `text-*` size, so size constants go first:
  `cn(T13_3, "leading-[1.2] …")`.
- Animation knobs are `--mock-*` custom properties registered with `@property { inherits: false }` so a parent's delay or
  duration never leaks into nested animated children; set them on the element that carries the animation class.
- Bare spacing values must be multiples of 0.25 (`top-223.25` works, `top-223.3` is silently dropped).
