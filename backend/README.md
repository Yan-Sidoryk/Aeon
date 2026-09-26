# Aeon backend

FastAPI backend for Aeon's website-in onboarding (`docs/user-journey-pharma-onboarding.md`) and dashboard: website → portfolio → hero drug → competitors + 10 questions → live AI scan → report of checks → "Fix this" drafts through an AI pre-MLR loop → competitor promotion opportunities → weekly tracking.

The API contract for the frontend is `docs/architecture.md` (plus `/docs` when the server runs).

## Run

```bash
npm run setup:api            # from the repo root: creates backend/.venv and installs this package
cp backend/.env.example backend/.env   # then fill in the keys
npm run dev:api:demo         # replays the recorded run, no keys needed
npm run dev:api              # live, with the keys in backend/.env
npm run test:api             # 19 tests, no keys or network
```

Local dev uses SQLite (leave `DATABASE_URL` empty): the same flow is about 3x slower against Supabase over the network. The tables and their rules are in `docs/data-model.md`.

## Keys (`backend/.env`)

| Key | Used for | Without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | every agent, the Claude engine, answer parsing, label checks, drafts, pre-MLR review | nothing live works; use demo mode |
| `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD` | Google AI Overviews + AI Mode engines, questions people ask on Google, brand search volume (hero pick) | Claude is the only engine; questions are written from the label |
| `APIFY_TOKEN` | competitors' current Google search ads (promo opportunities) | promo research fails |
| `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_HOST` | traces and evals | tracing is off |
| `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Supabase Postgres and auth | SQLite (`aeon.db`) and the `X-Session-Id` header |

## How it works

- **Agents** (`app/agents/`) run on the Anthropic SDK's tool runner (`client.beta.messages.tool_runner`). Claude chooses the next tool call until the job is done; every tool call streams to the UI as a step. `runner.py` adds prompt caching (each turn resends the history), `pause_turn` restarts and an iteration cap.
  - `discovery.py`: reads the site with Claude's web fetch and confirms each product with openFDA. The hero is the brand with the most Google searches (DataForSEO).
  - `setup.py`: 4–6 competitors, each verified against its FDA label, and exactly 6 unbranded + 2 branded + 2 comparison questions, preferring real ones from Google's "People also ask". The record tools enforce the rules.
  - `fix.py`: an evaluator–optimizer loop. Claude drafts from the label, calls `check_draft` (the pre-MLR checklist), reads the failed checks, revises, and checks again, for up to 3 rounds.
  - `promo.py`: pulls competitors' current Google search ads via Apify, reads the ad images, and records on-label opportunities (the label quote is verified verbatim).
- **Scan** (`services/scan.py`) is a plain workflow, not an agent, so the measurement isn't steered. Every question goes to every engine. Claude answers 3 times with web search on, and a cell is the majority vote. Google AI Overviews and AI Mode come through DataForSEO once each. Every answer that names the drug is checked against the FDA label (the label is prompt-cached).
- **Report** (`services/report.py`): checks and counts only, with no scores. It has per-engine tallies on unbranded questions, label conflicts, lost questions, sources cited only for competitors, per-competitor sources, changes since the last scan, and 3 fixes.
- **Durable jobs** (`jobs.py`): jobs and their progress events live in the database. The worker runs inside the API process, re-queues interrupted jobs on startup, and SSE streams replay from the database.
- **Weekly tracking** (`scheduler.py`): tracked drugs are re-scanned every 7 days; the report shows what changed.
- **Accounts** (`auth.py`): Supabase access tokens, including anonymous sign-in, or `X-Session-Id` without Supabase. Every non-report endpoint checks ownership.
- **Tracing** (`observability.py`): one Langfuse trace per job, with agent, tool and Claude-call spans (cost included).

## Evals

```bash
cd backend
.venv/bin/python -m app.evals.run label-check        # 12 label-grounded cases: flag contradictions, no false alarms
.venv/bin/python -m app.evals.run premlr             # checklist catches each violation and passes clean copy
.venv/bin/python -m app.evals.run fix-loop --report <report_id>   # the fix agent reaches "ready" within 3 rounds
```

Each run is a Langfuse experiment (dataset `aeon-label-check`, `aeon-premlr` or `aeon-fix-loop`), so runs compare side by side. The seed cases in `app/evals/cases.py` were written from the label by engineers and need medical-affairs review before they gate releases.

## Demo mode

Record one real run, then replay it instantly and offline:

```bash
# run the flow live through the API (onboarding → setup → scan → a fix → opportunities), then:
.venv/bin/python -m app.scripts.record_demo --company <company_id>
DEMO_MODE=1 .venv/bin/uvicorn app.main:app --port 8000
```

The bundle (`fixtures/demo/bundle.json`) holds the run's rows and each job's real event log, so replays show the agents' real steps and the fix loop's real rounds. Any website replays the recorded company, and the frontend shows a banner saying so.

## Staging (Fly.io + Vercel)

The API runs on Fly.io in London, next to Supabase (eu-west-1), as one always-on machine: the job worker and the weekly scheduler live inside the API process. `fly.toml` starts it in demo mode, so staging costs nothing until you switch it to live.

```bash
cd backend
fly auth login
fly launch --no-deploy --copy-config --name aeon-api-staging   # pick another name if it is taken
grep -v '^DEMO_MODE=' .env | fly secrets import                   # keys + Supabase DATABASE_URL; demo mode stays from fly.toml
fly deploy
curl https://aeon-api-staging.fly.dev/api/health
fly secrets set DEMO_MODE=0                                       # when you want live runs (they cost money)
```

Frontend on Vercel, from the repo root: `vercel link`, then set `NEXT_PUBLIC_API_URL` (the Fly URL), `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for Preview and Production, and `vercel deploy`. `NEXT_PUBLIC_` values are baked in at build time, so redeploy after changing them. Add the Vercel URL to Supabase Auth's site URL and redirect URLs.

## Cost (live, incyte.com, Sep 2026)

| Step | Time | Cost |
|---|---|---|
| Discovery agent | ~60 s | ~$0.25 |
| Setup agent | ~50 s | ~$0.15 Claude + ~$0.02 DataForSEO |
| Scan: 10 questions × (Claude ×3 + AI Overviews + AI Mode) | ~4 min | see Langfuse (scan trace) |
| Fix loop (up to 3 rounds) | ~2–3 min | ~$0.5 |
| Promo research | ~1–2 min | ~$0.05 Apify + Claude |
