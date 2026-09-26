<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Aeon

## What This Is
Aeon is an AI visibility and pre-MLR platform for pharma brands (see `docs/PRD.md` and
`docs/user-journey-pharma-onboarding.md`). This repo holds three things:
- the marketing site (`/`),
- the product frontend: the onboarding flow `/start/*` and the shareable report `/report/[id]` (with "Fix this" drafts),
- the FastAPI backend in `backend/` (discovery → setup → scan → report → pre-MLR). Its API contract is `docs/architecture.md`.

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
- **Backend:** Python 3.11+, FastAPI, SQLite, in-process asyncio jobs, live progress over SSE; Anthropic models (see `backend/README.md`)
- **Deployment:** frontend on Vercel. The backend needs its own long-running host (one process, in-memory jobs, SQLite, long SSE
  connections), not Vercel functions; point the frontend at it with `NEXT_PUBLIC_API_URL`

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript check
- `npm run check` — Run lint + typecheck + build
- `npm run setup:api` — Create `backend/.venv` and install the backend
- `npm run dev:api:demo` — Backend on :8000 replaying the recorded demo (no API keys needed). `npm run dev:api` for live runs
  with keys in `backend/.env`
- `npm run test:api` — Backend tests (no keys or network)

Local product development: `npm run dev:api:demo` in one terminal, `npm run dev` in another, then open `/start`.

## Code Style
- TypeScript strict mode, no `any`
- Named exports, PascalCase components, camelCase utils
- Tailwind utility classes, no inline styles (except data-driven values such as bar widths)
- 2-space indentation
- Responsive: mobile-first

## Design Principles
The emulation rules below apply to the marketing site. Product screens (`src/components/app/`) follow the product mocks in
`src/components/platform/mocks/`: white cards on off-white, royal for "you", stone for competitors, lime for passes, the
`alert-*` tokens for label conflicts.

- **Pixel-perfect emulation** — match the target's spacing, colors, typography exactly
- **No personal aesthetic changes during emulation phase** — match 1:1 first, customize later
- **Real content** — use actual text and assets from the target site, not placeholders
- **Beauty-first** — every pixel matters

## Project Structure
```
src/
  app/              # Next.js routes
    start/          # Onboarding screens 1-5 (website, portfolio, hero drug, setup, live scan)
    report/[id]/    # Screen 6: shareable report; fix/[key]/ is the "Fix this" draft + pre-MLR review
  components/       # React components
    app/            # Product UI (screens, report, fix workspace, shared atoms in ui.tsx)
    ui/             # shadcn/ui primitives
    icons.tsx       # Extracted SVG icons as React components
  lib/
    api.ts          # Typed client for the backend (every call goes through it)
    utils.ts        # cn() utility (shadcn)
  types/api.ts      # Backend response shapes, hand-written (OpenAPI has no response schemas yet)
  hooks/
    useJobStream.ts # SSE progress for discovery, scan and "Fix this" jobs
backend/            # FastAPI app, tests and the recorded demo (backend/README.md)
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
  Demo mode replays one recorded scan for any website, so the product UI must keep its demo banner: a replay must never
  pass for a real scan of the site someone typed in.
- When a backend response changes, update `src/types/api.ts` and `docs/architecture.md` in the same change.

@docs/research/INSPECTION_GUIDE.md
