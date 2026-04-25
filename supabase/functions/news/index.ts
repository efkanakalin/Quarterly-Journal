// Supabase Edge Function: news
// Proxies Financial Juice RSS, normalizes to JSON, caches in-memory.
// Client should poll every 30s; function itself caches for 25s.
//
// GET /functions/v1/news           -> { items: NewsItem[] }
// GET /functions/v1/news?since=ISO -> only items with publishedAt > since

import { handleOptions, jsonResponse } from '../_shared/cors.ts'

const FJ_RSS_URL = 'https://www.financialjuice.com/feed.ashx?xy=rss'
const CACHE_TTL_MS = 25_000

interface RawItem {
  id: string
  title: string
  link: string | null
  source: string
  publishedAt: string
}

let CACHE: { at: number; items: RawItem[] } = { at: 0, items: [] }

// ---- Lightweight RSS parser (no deps; extracts <item>{<title>,<link>,<pubDate>}) ----
function parseRss(xml: string): RawItem[] {
  const items: RawItem[] = []
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1]
    const title = pick(block, 'title')
    const link  = pick(block, 'link')
    const pub   = pick(block, 'pubDate') ?? pick(block, 'dc:date') ?? ''
    if (!title) continue
    const iso = pub ? new Date(pub).toISOString() : new Date().toISOString()
    items.push({
      id:          fnv1a(`${iso}|${title}`),
      title:       decodeEntities(stripCdata(title)).trim(),
      link:        link ? decodeEntities(stripCdata(link)).trim() : null,
      source:      'Financial Juice',
      publishedAt: iso,
    })
  }
  // Newest first
  items.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  return items
}

function pick(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = re.exec(block)
  return m ? m[1] : null
}

function stripCdata(s: string) {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
}

function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g,  "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function fnv1a(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

async function refreshIfStale(): Promise<RawItem[]> {
  if (Date.now() - CACHE.at < CACHE_TTL_MS && CACHE.items.length > 0) {
    return CACHE.items
  }
  const res = await fetch(FJ_RSS_URL, {
    headers: { 'user-agent': 'QT-Journal-News-Proxy/1.0' },
  })
  if (!res.ok) {
    // If fetch fails, serve stale cache rather than erroring
    if (CACHE.items.length) return CACHE.items
    throw new Error(`RSS fetch failed: ${res.status}`)
  }
  const xml = await res.text()
  const items = parseRss(xml)
  CACHE = { at: Date.now(), items }
  return items
}

Deno.serve(async (req) => {
  const pre = handleOptions(req)
  if (pre) return pre
  if (req.method !== 'GET') {
    return jsonResponse({ error: 'method not allowed' }, { status: 405 })
  }
  try {
    const url = new URL(req.url)
    const since = url.searchParams.get('since')
    const all = await refreshIfStale()
    const items = since
      ? all.filter(i => i.publishedAt > since)
      : all.slice(0, 200)
    return jsonResponse({ items, cachedAt: new Date(CACHE.at).toISOString() })
  } catch (e) {
    return jsonResponse({ error: String(e) }, { status: 500 })
  }
})
