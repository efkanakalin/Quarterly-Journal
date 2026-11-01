import type { CalendarEvent, EconRelease, Impact, NewsItem } from '@/types/news'
import { matchSymbols, scoreSentiment } from '@/lib/news/sentiment'
import { isImportantNews } from '@/lib/news/importance'
import { LOCAL_MODE } from '@/lib/supabase'

const SUPABASE_URL  = (import.meta.env.VITE_SUPABASE_URL ?? '') as string
const SUPABASE_ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '') as string

const fnBase = () => `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1`

const authHeaders = (): HeadersInit => ({
  apikey:        SUPABASE_ANON,
  authorization: `Bearer ${SUPABASE_ANON}`,
})

async function getJson<T>(path: string): Promise<T> {
  const url = `${fnBase()}${path}`
  let lastErr: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: authHeaders() })
      if (!res.ok) throw new Error(`${path} -> ${res.status}`)
      return res.json() as Promise<T>
    } catch (e) {
      lastErr = e
      // Brief backoff, then retry once on transient network/connection errors
      if (attempt === 0) await new Promise(r => setTimeout(r, 800))
    }
  }
  throw lastErr
}

// ---- News ----
/** Needs the optional `news` edge function (the RSS source blocks browser CORS); empty in local mode. */
type RawNews = {
  id: string; title: string; link: string | null;
  source: string; publishedAt: string
}

export async function fetchNews(since?: string): Promise<NewsItem[]> {
  if (LOCAL_MODE) return []
  const q = since ? `?since=${encodeURIComponent(since)}` : ''
  const items = (await getJson<{ items?: RawNews[] }>(`/news${q}`)).items ?? []
  return items.map(r => ({
    ...r,
    sentiment: scoreSentiment(r.title),
    symbols:   matchSymbols(r.title),
    important: isImportantNews(r.title),
  }))
}

// ---- Calendar ----
/** Needs the optional `calendar` edge function; empty in local mode. */
export async function fetchCalendar(
  impact: Impact[] = ['high', 'medium'],
): Promise<CalendarEvent[]> {
  if (LOCAL_MODE) return []
  const q = impact.length ? `?impact=${impact.join(',')}` : ''
  const { events = [] } = await getJson<{ events: CalendarEvent[] }>(`/calendar${q}`)
  return events
}

// ---- Economic releases (Finnhub) ----
/** Needs the optional `economic-data` edge function; empty in local mode. */
export async function fetchEconReleases(): Promise<EconRelease[]> {
  if (LOCAL_MODE) return []
  const { releases = [] } = await getJson<{ releases: EconRelease[] }>(
    '/economic-data?impact=high,medium,low',
  )
  return releases
}
