# News Panel — integration notes

The News route (`/news`) is composed of three zones powered by three Supabase
Edge Functions. The client polls them on fixed intervals; there is no server
push / realtime channel. All fetches are CORS-proxied server-side so the
browser never talks to third-party endpoints directly.

## Architecture

```
 Browser ── fetch ──▶ Supabase Edge Functions ── fetch ──▶ 3rd parties
                     │  news            (Financial Juice RSS)
                     │  economic-data   (Finnhub calendar — live actuals)
                     │  calendar        (ForexFactory weekly JSON)
```

Each function keeps an in-memory cache inside the warm invocation; client
polling keeps the instance warm enough to amortize upstream calls.

## Poll intervals

| Feed              | Client poll | Server cache TTL |
|-------------------|-------------|------------------|
| News (RSS)        | 30 s        | 25 s             |
| Finnhub releases  | 60 s        | 5 min            |
| ForexFactory cal. | 15 min      | 15 min           |

Deadline watcher (for "T-N minutes before red event" alerts) runs every 15 s
on the client.

**Where to change** → `src/stores/useNewsStore.ts` (`NEWS_POLL_MS`,
`ECON_POLL_MS`, `CALENDAR_POLL_MS`) and the `CACHE_TTL_MS` constants at the
top of each edge function.

## Environment

The client only needs:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Both backend keys live as Supabase secrets (never shipped to the browser):

```
supabase secrets set FINNHUB_API_KEY=...   # required
supabase secrets set FRED_API_KEY=...      # optional, legacy
```

Deploy all three functions:

```
supabase functions deploy news
supabase functions deploy economic-data
supabase functions deploy calendar
```

## Filter / keyword config

All keyword tables are in **`src/lib/news/keywords.ts`**:

- `POSITIVE_WORDS` / `NEGATIVE_WORDS` → sentiment border (green / red / none).
- `SYMBOL_KEYWORDS` → maps each filter chip (NQ, ES, YM, DXY, Gold, Oil, FX,
  Crypto, FED) to the keyword groups matched against the headline.
- `SYMBOL_LABELS` → chip labels shown in the UI.

All matching is **case-insensitive** with word-boundary regex. To add a new
filter chip:

1. Extend the `SymbolFilter` union in `src/types/news.ts`.
2. Add an entry to `SYMBOL_KEYWORDS` and `SYMBOL_LABELS`.
3. Add the new key to `ORDER` in `src/components/news/FilterChips.tsx`.

Nothing else needs to change — `scoreSentiment` / `matchSymbols` will pick it
up automatically.

## Economic data source

`supabase/functions/economic-data/index.ts` calls Finnhub's
`/calendar/economic` endpoint. It returns `actual`, `estimate`, `prev`,
`impact`, `country`, `time` in one shot — no separate forecast matching
needed. Only events with `actual != null` (i.e. already released) are
returned to the client.

Defaults: `countries=US`, `impact=high,medium`, last 7 days, cap 15. Both
are query params on the edge function — e.g. to also show EU:

```
GET /functions/v1/economic-data?countries=US,EU&impact=high,medium,low
```

Beat/miss/inline classification uses a `~0.2%` tolerance band
(`classify()` function) — adjust that if your preferred indicator is very
volatile.

## Alarms

Preferences live in `localStorage` under `qt-alarm-prefs`:

- `soundEnabled`, `sound` (`chime | ping | bell`), `volume` (0..1)
- `desktopEnabled` (also calls `Notification.requestPermission`)
- `notifyHighImpactMinutes` (default 5)

Sounds are synthesized via the Web Audio API (no binary assets). To swap in
real MP3 files, replace `playAlarm()` in `src/stores/useAlarmStore.ts` with
`new Audio('/sounds/…').play()` and drop the files under `public/sounds/`.

Accessibility: animations on the "next red event" countdown are disabled by
`motion-reduce:animate-none`. Filter chips are role=tab / aria-selected.

## Adding a new source

If you want to proxy, say, Reuters:

1. Create `supabase/functions/reuters/index.ts` (copy `news/index.ts` as a
   template — same cache pattern).
2. Add a fetcher to `src/lib/api/news.ts` that calls it.
3. Merge its items into the store — either in a new slice (`reutersItems`)
   or, simpler, normalize to `NewsItem` and concat into `items` in
   `useNewsStore`'s `tickNews`.

Keep the client polling at 30 s or slower to stay well below any upstream
rate limit.

## Don'ts

- Do **not** call FJ RSS from the browser. It blocks CORS.
- Do **not** ship the FRED key in `.env` — it belongs in Supabase secrets.
- Do **not** scrape Discord / paid feeds.
