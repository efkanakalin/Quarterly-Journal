# Quarterly Journal

A Quarterly Theory–native trade journal. Unlike generic journals, it models
every trade around the QT framework: Q/D/W cycle position, session, 90-minute
micro-quarters, confirmation chain, mistake tagging, and a composite
**QT Score**. Pairs with a live news & economic-calendar panel so you can
keep context on macro events while reviewing your tape.

## Features

- **Journal** — inline-edit trade table, double-click-to-edit cells, per-cell
  selection ring, PnL / Notes hide toggles.
- **Dashboard** — cumulative PnL, drawdown, session heatmap, weekly bars,
  mistake frequency, confirmation effectiveness, radar-shaped QT Score.
- **Daily Stats** — per-day grouped view with intraday cumulative chart,
  winner/loser tallies, and a per-day journaling note (localStorage).
- **CSV import** — Tradovate Performance.csv → normalized trades, with Europe
  /Istanbul → America/New_York conversion including DST.
- **Broker auto-sync** — Brokers page (`/brokers`) connects a Tradovate
  account via OAuth and pulls new fills incrementally. All Tradovate
  traffic goes through a tiny Cloudflare Worker (`cloudflare-worker/`)
  that verifies the user's Supabase JWT before proxying — Tradovate's
  API does not allow browser CORS, and `client_secret` never reaches
  the client. MT4/5, Binance, IBKR are stubbed as Coming Soon.
- **News panel** (`/news`) — three zones:
  - *Live Feed* (Financial Juice RSS, 30-second poll, sentiment-bordered
    headlines, virtualized list of last 50)
  - *Economic Calendar* (ForexFactory weekly JSON, 15-minute cache,
    day-by-day navigator, impact colours, countdown badge on the next
    high-impact event)
  - *Economic Data* (Finnhub calendar, 5-minute cache, last 10 released
    US high/medium events with actual vs forecast vs previous & beat/miss
    colouring)
- **Alarms** — synthesized tones via Web Audio; configurable lead-time for
  high-impact events; desktop notifications; preferences persisted locally.
- **i18n** — English + Turkish toggle, every user-visible string keyed.
- **Themes** — class-based dark/light, persisted.

## Stack

| Layer       | Tech                                        |
|-------------|---------------------------------------------|
| Frontend    | React 19 + Vite 8 + TypeScript 6            |
| Styling     | Tailwind CSS v4, @base-ui/react primitives  |
| State       | Zustand (with `persist` middleware)         |
| Routing     | React Router v7                             |
| Charts      | Recharts                                    |
| Virtualize  | @tanstack/react-virtual                     |
| CSV         | PapaParse                                   |
| Dates       | date-fns + date-fns-tz                      |
| Backend     | Supabase (Postgres + RLS + Auth + Edge Fns) |
| Deploy      | Cloudflare Pages / Netlify (SPA)            |

## Local setup

```bash
git clone <repo>
cd quarterly-journal
npm install
cp .env.example .env
# fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev          # http://localhost:5173
```

### Supabase setup (one-time)

1. **Project:** create a Supabase project, copy URL & anon key into `.env`.
2. **Schema:** open the SQL editor, run `supabase/migrations/*.sql` in order.
3. **Auth:** Authentication → Providers → enable Google; add the OAuth
   credentials (create them in Google Cloud Console, redirect URI
   `https://<project-ref>.supabase.co/auth/v1/callback`).
4. **Edge functions** (for the News panel):

   ```bash
   supabase login
   supabase functions deploy news           --project-ref <ref> --no-verify-jwt
   supabase functions deploy economic-data  --project-ref <ref> --no-verify-jwt
   supabase functions deploy calendar       --project-ref <ref> --no-verify-jwt
   supabase secrets set FINNHUB_API_KEY=... --project-ref <ref>
   ```

   The `--no-verify-jwt` flag is intentional: these three functions are
   read-only public-data proxies and don't need user auth.

### Tradovate auto-sync (optional)

Brokers page'in Tradovate bağlantısını çalıştırmak için Cloudflare Worker
proxy'yi deploy etmek gerekir — Tradovate browser CORS'u kapalı tutar.

1. **OAuth app** — Tradovate hesabınızda OAuth client ID/secret oluşturun
   ve redirect URI'yi `https://<your-host>/brokers/tradovate/callback`
   olarak girin.
2. **Worker deploy** — `cloudflare-worker/README.md` adımlarını izleyin
   (`wrangler secret put`'larla `TRADOVATE_CLIENT_ID`,
   `TRADOVATE_CLIENT_SECRET`, `SUPABASE_JWT_SECRET` set edilir).
3. **Frontend `.env`** — worker URL'sini ve client ID'yi ekleyin:

   ```
   VITE_TRADOVATE_WORKER_URL=https://qt-journal-tradovate-proxy.<acct>.workers.dev
   VITE_TRADOVATE_CLIENT_ID=<your-tradovate-client-id>
   ```

4. **Migration** — `supabase/migrations/005_broker_connections.sql`
   uygulanmış olmalı; tablo `broker_connections`'tır ve RLS user-scoped.

### CSV import

Tradovate → Account Settings → Reports → **Performance** tab → pick a date
range → Download CSV → in Quarterly Journal's Journal page, click "Import CSV".
Timestamps arrive in Europe/Istanbul and are converted to America/New_York
with DST handled correctly.

## Environment variables

Client `.env` (only two — never put server secrets here, anything prefixed
`VITE_` is exposed to the browser):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable or jwt anon key>
```

Supabase secrets (read by edge functions, never shipped to the browser):

```
FINNHUB_API_KEY=...        # required for /functions/v1/economic-data
FRED_API_KEY=...           # optional legacy fallback
```

Set with `supabase secrets set KEY=VALUE --project-ref <ref>`.

## Folder structure

```
quarterly-journal/
├── public/                  # Static assets (logo, favicon, _redirects)
├── src/
│   ├── components/
│   │   ├── dashboard/       # Dashboard widgets (charts, cards, heatmap)
│   │   ├── journal/         # Trade table, wizard, CSV upload, badges
│   │   │   └── wizard/      # 4-step modal for completing CSV trades
│   │   ├── layout/          # AppLayout, Sidebar
│   │   ├── news/            # Live feed, calendar, econ data, alarms
│   │   ├── shared/          # CalendarGrid, AuthGuard, DayTradesModal
│   │   └── ui/              # Generic primitives (dialog, select, button…)
│   ├── lib/
│   │   ├── api/             # Client wrappers for edge functions
│   │   ├── constants/       # Symbols, sessions, palettes, confirmations
│   │   ├── csv/             # Papaparse adapter + CSV fingerprint check
│   │   ├── derivations/     # Pure fns: outcome, session, quarter, …
│   │   ├── i18n/            # en.ts, tr.ts + useS() hook
│   │   ├── metrics/         # qtScore + config
│   │   ├── news/            # keywords, sentiment, formatting helpers
│   │   ├── formatET.ts      # ET timestamp formatter
│   │   ├── stats.ts         # calcStats / drawdown / cumulative / per-day
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts         # cn() and small helpers
│   ├── pages/               # Route-level components
│   ├── stores/              # Zustand slices (auth, lang, theme, trades,
│   │                        # dashboard, news, alarm)
│   ├── types/               # Shared TypeScript types
│   ├── App.tsx              # <Routes> + auth bootstrap
│   ├── main.tsx             # ReactDOM entry
│   └── index.css            # Tailwind + keyframes
├── supabase/
│   ├── functions/
│   │   ├── _shared/cors.ts  # CORS helper shared by all functions
│   │   ├── news/            # Financial Juice RSS proxy
│   │   ├── economic-data/   # Finnhub calendar → released events
│   │   └── calendar/        # ForexFactory weekly → normalized events
│   └── migrations/          # SQL applied via Supabase dashboard
├── NEWS_PANEL.md            # Deep-dive on the news panel
├── .env.example
└── vite.config.ts
```

## Scripts

| Command          | What it does                                      |
|------------------|---------------------------------------------------|
| `npm run dev`    | Start Vite dev server on :5173 with HMR           |
| `npm run build`  | `tsc -b` + `vite build` → `dist/`                 |
| `npm run preview`| Serve the built bundle locally                    |
| `npm run lint`   | ESLint over `src/`                                |

## Deploy

Any static-SPA host works. Two options:

- **Cloudflare Pages** — connect GitHub repo, build cmd `npm run build`,
  output dir `dist`. Add the two `VITE_*` env vars.
- **Netlify** — same build/output; `public/_redirects` already ships the
  SPA fallback.

Supabase edge functions are deployed separately via the Supabase CLI
(see the `supabase functions deploy …` commands above).

## Further reading

- `NEWS_PANEL.md` — polling intervals, keyword table locations, how to add
  a new symbol filter or news source, and tweaks for the forecast/actual
  comparison logic.

## License

MIT — free and open source.
