// Supabase Edge Function: economic-data
// Uses Finnhub economic calendar. Returns "just-released" data points
// (actual populated within a recent window). Cache 5 min.
//
// GET /functions/v1/economic-data               -> last ~72h of released US events
// GET /functions/v1/economic-data?countries=US,EU,GB,JP -> multi-country

import { handleOptions, jsonResponse } from '../_shared/cors.ts'

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY') ?? ''
const CACHE_TTL_MS    = 5 * 60_000

// How far back / forward to pull from Finnhub
const LOOKBACK_DAYS = 7
const LOOKAHEAD_DAYS = 1

interface RawFinnhub {
  actual:   number | null
  country:  string
  estimate: number | null
  event:    string
  impact:   string
  prev:     number | null
  time:     string    // "YYYY-MM-DD HH:mm:ss" (UTC per docs)
  unit:     string
}

interface EconRelease {
  id:              string
  title:           string
  country:         string       // ISO like "US"
  actual:          number | null
  previous:        number | null
  forecast:        number | null
  unit:            string
  referenceDate:   string
  releasedAt:      string
  impact:          'high' | 'medium' | 'low'
  beatExpectation: 'beat' | 'miss' | 'inline' | 'unknown'
  changePct:       number | null
}

let CACHE: { at: number; releases: EconRelease[] } = { at: 0, releases: [] }

function fnv1a(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function classify(
  actual: number | null,
  forecast: number | null,
): EconRelease['beatExpectation'] {
  if (actual == null || forecast == null) return 'unknown'
  if (!Number.isFinite(actual) || !Number.isFinite(forecast)) return 'unknown'
  const diff = actual - forecast
  const tol  = Math.max(Math.abs(forecast) * 0.002, 0.01)
  if (Math.abs(diff) <= tol) return 'inline'
  return diff > 0 ? 'beat' : 'miss'
}

function normalizeImpact(raw: string): EconRelease['impact'] {
  const v = (raw ?? '').toLowerCase()
  if (v.includes('high'))   return 'high'
  if (v.includes('medium')) return 'medium'
  return 'low'
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10)
}

async function fetchFromFinnhub(): Promise<EconRelease[]> {
  const now   = new Date()
  const from  = new Date(now.getTime() - LOOKBACK_DAYS  * 86_400_000)
  const to    = new Date(now.getTime() + LOOKAHEAD_DAYS * 86_400_000)
  const url =
    `https://finnhub.io/api/v1/calendar/economic?from=${ymd(from)}&to=${ymd(to)}&token=${encodeURIComponent(FINNHUB_API_KEY)}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Finnhub ${res.status}`)
  const json = await res.json() as { economicCalendar?: RawFinnhub[] }
  const list = json.economicCalendar ?? []

  return list.map(r => {
    // time arrives as "YYYY-MM-DD HH:mm:ss" in UTC
    const iso = new Date(`${r.time}Z`).toISOString()
    return {
      id:              fnv1a(`${r.country}|${r.event}|${r.time}`),
      title:           r.event,
      country:         (r.country ?? '').toUpperCase(),
      actual:          r.actual  ?? null,
      previous:        r.prev    ?? null,
      forecast:        r.estimate ?? null,
      unit:            r.unit ?? '',
      referenceDate:   iso,
      releasedAt:      iso,
      impact:          normalizeImpact(r.impact),
      beatExpectation: classify(r.actual, r.estimate),
      changePct:
        r.actual != null && r.prev != null && r.prev !== 0
          ? ((r.actual - r.prev) / Math.abs(r.prev)) * 100
          : null,
    }
  })
}

async function refreshIfStale(): Promise<EconRelease[]> {
  if (Date.now() - CACHE.at < CACHE_TTL_MS && CACHE.releases.length) {
    return CACHE.releases
  }
  const all = await fetchFromFinnhub()
  CACHE = { at: Date.now(), releases: all }
  return all
}

Deno.serve(async (req) => {
  const pre = handleOptions(req)
  if (pre) return pre
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  }
  if (!FINNHUB_API_KEY) {
    return jsonResponse({
      releases: [],
      error: 'FINNHUB_API_KEY is not set. Configure with `supabase secrets set FINNHUB_API_KEY=...`',
    })
  }
  try {
    const url = new URL(req.url)
    const countries = (url.searchParams.get('countries') ?? 'US')
      .split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
    const impactFilter = (url.searchParams.get('impact') ?? 'high,medium')
      .split(',').map(s => s.trim().toLowerCase()).filter(Boolean) as EconRelease['impact'][]

    const all = await refreshIfStale()

    // Country + impact filter; released-only; newest first; cap 40
    // (client trims to 10 with its own low-impact toggle).
    const released = all
      .filter(r => countries.includes(r.country))
      .filter(r => impactFilter.includes(r.impact))
      .filter(r => r.actual != null)
      .sort((a, b) => b.releasedAt.localeCompare(a.releasedAt))
      .slice(0, 40)

    return jsonResponse({
      releases: released,
      cachedAt: new Date(CACHE.at).toISOString(),
    })
  } catch (e) {
    return jsonResponse({ error: String(e) }, { status: 500 })
  }
})
