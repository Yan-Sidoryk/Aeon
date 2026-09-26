# Aeon backend

FastAPI backend for the website-in onboarding flow (`docs/user-journey-pharma-onboarding.md`): URL → portfolio → hero drug → competitors + prompts → live AI scan → report → "Fix this" draft with a pre-MLR score.

## Run

```bash
cd backend
pip install -e ".[dev]"
cp .env.example .env        # set ANTHROPIC_API_KEY (+ FIRECRAWL_API_KEY)
uvicorn app.main:app --reload
```

The OpenAPI contract for the frontend is at http://localhost:8000/docs. Run the tests with `pytest` (no keys or network needed).

## Keys

| Key | Needed for | Without it |
|---|---|---|
| `ANTHROPIC_API_KEY` | extraction, prompts, Claude engine, accuracy check, drafts, pre-MLR | nothing live works; use demo mode |
| `FIRECRAWL_API_KEY` | multi-page crawl incl. linked brand sites | homepage-only plain HTTP fetch |
| `OPENAI_API_KEY`, `GEMINI_API_KEY`, `PERPLEXITY_API_KEY`, `SERPAPI_KEY` (AI Overviews) | extra scan engines | engine shows as disabled in `/api/engines` |

Firecrawl free plans allow about 20 requests per minute. One onboarding uses about 6–10 (map + batch scrape + status polls), so run at most about 2 onboardings per minute. The client retries on 429.

Each engine adapter lives in `app/engines/`. They switch on as soon as their key is set; no code change is needed. Only the Claude adapter has been run against a live API. The others follow each provider's documented API but have not been tested yet.

## Demo mode

Record one real company once, then replay it instantly and offline:

```bash
python -m app.scripts.record_demo incyte.com --hero Opzelura   # full live run → fixtures/demo/bundle.json
python -m app.scripts.record_demo --company 4                  # rescan an existing company (keeps its prompts)
DEMO_MODE=1 uvicorn app.main:app
```

The committed bundle is a real run for incyte.com with Opzelura as the hero: "You 69 vs Protopic 62" on unbranded questions, AI answers that give the wrong pediatric age, and 3 drafts through pre-MLR. Opzelura was chosen over the auto-picked Jakafi because Jakafi is the standard of care (80% unbranded visibility), so it tells no competitive story.

## Live performance (incyte.com, Claude engine only)

| Step | Time | Notes |
|---|---|---|
| Discovery | ~22 s | Firecrawl map + batch scrape (~11 s), Haiku extraction, openFDA, Haiku enrichment |
| Setup | ~15 s | Opus (low effort) competitors verified against openFDA, Haiku prompts |
| Scan, 40 prompts | ~2 m 50 s | Opus + web search at low effort, 16 concurrent; Haiku parse; Opus accuracy check (medium) |
| Fix draft + pre-MLR | ~1 m | Opus at medium effort. At high effort it took ~3 min |

Effort levels and models are set in `app/config.py` (`engine_effort`, `accuracy_effort`, `draft_effort`, `model_*`).

In demo mode, any URL replays the recorded company through the same endpoints and SSE events.

## Frontend flow

All calls to `/api/onboarding` and `/api/orgs/save` send an `X-Session-Id` header (a UUID the browser generates once). This is the anonymous-first session.

1. `POST /api/onboarding {url}` → `{job_id, company_id}`; stream `GET /api/onboarding/{job_id}/events` (`step` events for the checklist, then `done` or `error`).
2. `GET /api/companies/{id}` → company card + product cards. Products with `partner: true` carry another company's FDA label (licensed or co-marketed). They start unticked, can never be the hero, and should be shown with "Labeled by {labeler}". Products with `pipeline: true` are unlaunched and not scanned. Untick with `PATCH /api/products/{id} {selected}`, add with `POST /api/companies/{id}/products {brand}`. If `labeler_candidates` has more than one entry, ask "Which of these are you?".
3. The hero drug is `is_hero` on a product. Change it with `POST /api/products/{id}/hero`.
4. `POST /api/products/{id}/setup` → competitors + prompts. It is idempotent; pass `?regenerate=true` to rebuild. Edit with the competitor endpoints and `PUT /api/products/{id}/prompts`.
5. `POST /api/products/{id}/scans` → `{scan_id, engines}`; stream `GET /api/scans/{id}/events` (`answer` per grid cell, `counters`, then `done {report_id}`).
6. `GET /api/reports/{id}` (public, shareable) → headline, accuracy issues, lost prompts, competitor-only sources, fixes, grid. `POST /api/reports/{id}/fixes/{key}` returns `{draft_id}` when the draft already exists. Otherwise it returns `202 {job_id}`: stream `GET /api/fixes/{job_id}/events` (`step` events, then `done {draft_id}`), then call `GET /api/drafts/{draft_id}` → `content_md`, `claims[]`, `premlr {risk_score, risk_level, blocked, fast_track, flags[]}`. A live draft takes about 1–2 minutes.
   The report headline scores **unbranded** questions only (`headline.scope`), where AI chooses what to recommend. Branded questions mention the brand by construction, so the all-prompts number is in `all_prompts`.
7. Save gate: `POST /api/orgs/save {email}`.

SSE streams replay their history, so connecting late is fine. Jobs live in memory: after a server restart, poll `GET /api/scans/{id}` instead.
