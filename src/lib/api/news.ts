import type { CalendarEvent, EconRelease, Impact, NewsItem } from '@/types/news'
import { matchSymbols, scoreSentiment } from '@/lib/news/sentiment'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

const fnBase = () => `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1`

const authHeaders = (): HeadersInit => ({
  apikey:        SUPABASE_ANON,
  authorization: `Bearer ${SUPABASE_ANON}`,
})

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${fnBase()}${path}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`${path} -> ${res.status}`)
  return res.json() as Promise<T>
}

// ---- News ----
type RawNews = {
  id: string; title: string; link: string | null;
  source: string; publishedAt: string
}
export async function fetchNews(since?: string): Promise<NewsItem[]> {
  const q = since ? `?since=${encodeURIComponent(since)}` : ''
  const { items = [] } = await getJson<{ items: RawNews[] }>(`/news${q}`)
  return items.map(r => ({
    ...r,
    sentiment: scoreSentiment(r.title),
    symbols:   matchSymbols(r.title),
  }))
}

// ---- Calendar ----
export async function fetchCalendar(
  impact: Impact[] = ['high', 'medium'],
): Promise<CalendarEvent[]> {
  const q = impact.length ? `?impact=${impact.join(',')}` : ''
  const { events = [] } = await getJson<{ events: CalendarEvent[] }>(`/calendar${q}`)
  return events
}

// ---- Economic releases (Finnhub) ----
export async function fetchEconReleases(): Promise<EconRelease[]> {
  const { releases = [] } = await getJson<{ releases: EconRelease[] }>(
    '/economic-data?impact=high,medium,low',
  )
  return releases
}
