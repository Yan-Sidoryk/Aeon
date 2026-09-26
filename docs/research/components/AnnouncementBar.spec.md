# AnnouncementBar spec (7shifts `#top-banner`)

## Overview
- Target file: `src/components/AnnouncementBar.tsx` (export `AnnouncementBar`), root `data-section="announcement"`.
- Reference: top 37px of `docs/design-references/header/7s-header-1440.jpg` and `7s-header-390-closed.jpg`.
- Interaction model: static, fixed at the top of the viewport for the whole page. The whole bar is one link;
  hover lowers its opacity to 0.9 (150ms). No scroll behaviour.

## DOM structure
```
div#top-banner.fixed.top-0.inset-x-0.z-[103].bg-black.w-full.h-[37px]
  a.flex.h-full.items-center.justify-center...
    span "New:"          (Nanum Pen Script, lime)
    span.min-w-0.truncate
      span.md:hidden        short text
      span.hidden.md:inline long text
    svg arrow 16x16      (stroke 1.5, currentColor)
```

## Computed styles
| Element | < 567px | >= 567px |
| --- | --- | --- |
| bar | fixed; top 0; width 100%; height 37px; bg #000; z 103 (Aeon: z-[110] per page contract) | same |
| link | flex; centre/centre; gap 6px; padding 0 12px; 13px / line-height 1.2 (15.6px) / 500 "medium" (-> Geist); white; nowrap; hover opacity .9 (transition opacity 150ms cubic-bezier(.4,0,.2,1)) | gap 8px; padding 0 20px; 14px (16.8px) |
| "New:" | Nanum Pen Script 15px (18px line); #c6ff94; shrink-0 | 16px (19.2px) |
| text | min-width 0; truncate (overflow hidden, ellipsis) | same |
| arrow | 16x16 `ArrowThinIcon`; shrink-0 | same |

Long text shows from 7shifts' `md` = **810px** (our theme's `md:` is 810px too); below that the short text.
Measured @1440: "New:" x 459.9 (w 26.9), text w 461.3, arrow x 964.1 — content centred.

## States & behaviours
| Trigger | Before | After | Transition |
| --- | --- | --- | --- |
| Hover bar | opacity 1 | opacity .9 | opacity 150ms cubic-bezier(.4,0,.2,1) |
| Focus-visible | — | inset 2px lime ring (Aeon a11y addition; 7shifts shows none) | — |

## Aeon content mapping
- Badge `New:`; text `AI pre-MLR review is now in Aeon. Drafts arrive claim-referenced and approval-ready.`
  (< 810px: `AI pre-MLR review is now in Aeon.`); link `#platform`.

## Responsive behaviour
- 1440 / 768: 14px text, 20px side padding (768 shows the short text, like 7shifts).
- 390: 13px text, 12px side padding, 15px badge, short text.
