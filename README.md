# ACC Business Club

Website for the [Adamjee Cantonment College](https://accbusinessclub.cloud) Business Club — a static, no-framework site (vanilla HTML/CSS/JS) deployed at **accbusinessclub.cloud**.

## Structure

```
docs/            → the website (deployable root, GH Pages-ready)
  index.html     → home (hero, bento grid, member previews)
  join/          → applicant join form (POSTs to the backend API)
  executives/    → Executive Members panel
  teachers/      → Teachers panel
  advisors/      → Advisors panel
  alumni/        → Alumni panel (year tabs)
  gallery/       → Gallery (bento grid: images + achievements + events)
  about/         → About
  contact/       → Contact
  js/            → renderers: members.js (cards + profile modal), hero.js, alumni.js, join.js, …
  css/           → base / layout / components / pages / responsive
  *.json         → all site content lives here (acts as the CMS)
  assets/        → member photos (.webp), gallery images, logo

src/             → registration API (Express, no build step)
  index.js       → server entry (reads PORT from .env)
  app.js         → express app + middleware wiring
  config/        → env.js, supabase.js
  middleware/    → cors, error handlers
  routes/        → /api/public/registration route, /api/health route
  services/      → registration.service.js, turnstile.service.js, auto-ping.service.js
  validators/    → registration.validator.js (single source of truth for field rules)
  db/migrations/ → SQL for the Supabase `registrations` table
  tests/         → verify-registration.js (33-case contract suite)
```

## How it works

No build step. Each page is a static `index.html` that fetches its section's JSON
(`executives.json`, `teachers.json`, …) and renders member cards client-side.
Clicking a card opens a flip-card profile modal with quote, achievements, and
social links (Facebook / Instagram / LinkedIn / WhatsApp).

### Updating content

Edit the JSON files in `docs/` — no code changes needed:

- `executives.json`, `teachers.json`, `advisors.json`, `alumni.json` — member records (`name`, `role`, `image`, `quote`, `achievements`, socials, `year` for alumni)
- `gallery.json` — gallery bento grid (`type`: `image` | `achievement` | `event`, with `title`/`year`/`description` for text tiles)
- `about.json`, `contact.json` — page content

### Running locally

Serve `docs/` from any static server:

```sh
# from the repo root
python3 -m http.server 8000 --directory docs
# or
npx serve docs
```

> Note: navigation uses absolute paths (e.g. `/executives.json`), so serve at
> the domain root — that's how it runs on accbusinessclub.cloud.

### Running the backend

```sh
node src/index.js            # or: npm start
npm run verify:registration  # 33-case validation contract suite (no server needed)
```

Requires `.env` with `SUPABASE_BASE_URL`, `SUPABASE_SERVICE_ROLE_SECRET`,
`TURNSTILE_SECRET_KEY`, `ALLOWED_ORIGINS`, `PORT`. Schema changes live in
`src/db/migrations/` and are pasted into the Supabase SQL Editor.

`GET /api/health` is a CORS-free liveness probe (`200 {"status":"ok"}`).
`AUTO_PING_TARGETS` (comma-separated URLs, optional) makes the server GET those
URLs itself — one independent loop per target: fire immediately, wait a random
1–10 s, repeat. Empty value disables it. See `AGENTS/health-auto-ping.md`.

## Repo hygiene

Everything outside `docs/` (scratch dirs, crawl archives, vendored tooling) is
gitignored. `git status --ignored` shows the full ignore list.