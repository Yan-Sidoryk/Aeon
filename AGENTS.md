<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Aeon

## What This Is
Aeon is an AI visibility and pre-MLR platform for pharma brands (see `docs/PRD.md` and
`docs/user-journey-pharma-onboarding.md`). This repo holds the marketing site and, later, the product frontend.

The marketing site was built with the `/clone-website` workflow from the AI Website Cloner template
(MIT, see `third_party/`): layout and interactions follow https://www.7shifts.com/, messaging follows
https://pharma-geo.com/ rewritten for Aeon (copy deck: `docs/research/AEON_CONTENT.md`), and the logo,
photos, doodle icons, covers and hero video were generated with Higgsfield (raw sources in `assets-src/`,
web versions via `node scripts/optimize-assets.mjs`).

## Tech Stack
- **Framework:** Next.js 16 (App Router, React 19, TypeScript strict)
- **UI:** shadcn/ui (Radix primitives, Tailwind CSS v4, `cn()` utility)
- **Icons:** Lucide React (default — will be replaced/supplemented by extracted SVGs)
- **Styling:** Tailwind CSS v4 with oklch design tokens
- **Deployment:** Vercel

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check
- `npm run check` — Run lint + typecheck + build

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles
- 2-space indentation
- Responsive: mobile-first

## Design Principles
- **Pixel-perfect emulation** — match the target's spacing, colors, typography exactly
- **No personal aesthetic changes during emulation phase** — match 1:1 first, customize later
- **Real content** — use actual text and assets from the target site, not placeholders
- **Beauty-first** — every pixel matters

## Project Structure
```
src/
  app/              # Next.js routes
  components/       # React components
    ui/             # shadcn/ui primitives
    icons.tsx       # Extracted SVG icons as React components
  lib/
    utils.ts        # cn() utility (shadcn)
  types/            # TypeScript interfaces
  hooks/            # Custom React hooks
public/
  images/           # Downloaded images from target site
  videos/           # Downloaded videos from target site
  seo/              # Favicons, OG images, webmanifest
docs/
  research/         # Inspection output (design tokens, components, layout)
  design-references/ # Screenshots and visual references
scripts/            # Asset download scripts
```

## MOST IMPORTANT NOTES
- When launching Claude Code agent teams, give each teammate exclusive ownership of a disjoint set of files. Prefer separate worktree branches merged by the orchestrator; on this 16 GB machine the marketing-site build instead ran all builders in the main tree against one shared `next dev` server, because ten worktrees each with their own dev server would exhaust memory.
- Aeon never shows fabricated customers, testimonials, ratings or results. Third-party stats always show their source.

@docs/research/INSPECTION_GUIDE.md
