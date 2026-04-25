// Supabase Edge Function: calendar
// Proxies ForexFactory weekly JSON, normalizes, caches 15 min.
// GET /functions/v1/calendar?impact=high,medium -> filtered & normalized events

import { handleOptions, jsonResponse } from '../_shared/cors.ts'

const FF_URL = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json'
const CACHE_TTL_MS = 15 * 60_000

type RawFF = {
  title:    string
  country:  string
  date:     string
  impact:   string
  forecast: string
  previous: string
}

type Impact = 'high' | 'medium' | 'low' | 'holiday'

interface CalendarEvent {
  id:       string
  time:     string | null
  currency: string
  title:    string
  impact:   Impact
  forecast: string | null
  previous: string | null
  actual:   string | null
}

let CACHE: { at: number; events: CalendarEvent[] } = { at: 0, events: [] }

function fnv1a(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function normalizeImpact(raw: string): Impact {
  const v = (raw ?? '').toLowerCase()
  if (v.includes('high'))    return 'high'
  if (v.includes('medium'))  return 'medium'
  if (v.includes('low'))     return 'low'
  return 'holiday'
}

function normalize(raw: RawFF[]): CalendarEvent[] {
  return raw
    .filter(r => r && r.title)
    .map(r => {
      const iso = r.date ? new Date(r.date).toISOString() : null
      return {
        id:       fnv1a(`${r.country}|${r.title}|${r.date}`),
        time:     iso,
        currency: (r.country ?? '').toUpperCase(),
        title:    r.title,
        impact:   normalizeImpact(r.impact),
        forecast: r.forecast || null,
        previous: r.previous || null,
        actual:   null,
      }
    })
    .sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''))
}

async function refreshIfStale(): Promise<CalendarEvent[]> {
  if (Date.now() - CACHE.at < CACHE_TTL_MS && CACHE.events.length) {
    return CACHE.events
  }
  const res = await fetch(FF_URL, {
    headers: { 'user-agent': 'QT-Journal-Calendar-Proxy/1.0' },
  })
  if (!res.ok) {
    if (CACHE.events.length) return CACHE.events
    throw new Error(`FF fetch failed: ${res.status}`)
  }
  const raw = (await res.json()) as RawFF[]
  const events = normalize(raw)
  CACHE = { at: Date.now(), events }
  return events
}

Deno.serve(async (req) => {
  const pre = handleOptions(req)
  if (pre) return pre
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  }
  try {
    const url = new URL(req.url)
    const filter = (url.searchParams.get('impact') ?? '')
      .split(',').map(s => s.trim()).filter(Boolean) as Impact[]
    const all = await refreshIfStale()
    const events = filter.length > 0
      ? all.filter(e => filter.includes(e.impact))
      : all
    return jsonResponse({ events, cachedAt: new Date(CACHE.at).toISOString() })
  } catch (e) {
    return jsonResponse({ error: String(e) }, { status: 500 })
  }
})
