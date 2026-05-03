/**
 * Per-user rate limiting using Cloudflare KV.
 *
 * Sliding-window-ish: iki ayrı pencere (dakika + gün) sayaçları.
 * KV TTL ile self-expire — manuel temizlik gerekmez.
 *
 * Limitler:
 *   - 60 req/min  per user  (burst koruması)
 *   - 800 req/day per user  (uzun vadeli abuse koruması)
 *
 * Eğer RATE_LIMIT KV namespace bind edilmemişse fail-open çalışır
 * (rate limit devre dışı, ama uygulama kırılmaz).
 */

const PER_MIN_LIMIT = 60
const PER_DAY_LIMIT = 800

export interface RateLimitEnv {
  RATE_LIMIT?: KVNamespace
}

export interface RateLimitResult {
  ok:        boolean
  limitedBy: 'minute' | 'day' | null
  retryAfter: number   // saniye
  remaining: { minute: number; day: number }
}

export async function rateLimit(env: RateLimitEnv, userId: string): Promise<RateLimitResult> {
  // KV bind edilmemişse fail-open
  if (!env.RATE_LIMIT) {
    return { ok: true, limitedBy: null, retryAfter: 0, remaining: { minute: PER_MIN_LIMIT, day: PER_DAY_LIMIT } }
  }

  const now = Date.now()
  const minute = Math.floor(now / 60_000)
  const day    = Math.floor(now / 86_400_000)

  const minKey = `rl:${userId}:m:${minute}`
  const dayKey = `rl:${userId}:d:${day}`

  // Read both
  const [minCountRaw, dayCountRaw] = await Promise.all([
    env.RATE_LIMIT.get(minKey),
    env.RATE_LIMIT.get(dayKey),
  ])
  const minCount = parseInt(minCountRaw ?? '0', 10)
  const dayCount = parseInt(dayCountRaw ?? '0', 10)

  // Day limit (önce kontrol — daha sıkı sınır)
  if (dayCount >= PER_DAY_LIMIT) {
    const secsToNextDay = 86_400 - Math.floor((now % 86_400_000) / 1000)
    return {
      ok: false,
      limitedBy: 'day',
      retryAfter: secsToNextDay,
      remaining: { minute: Math.max(0, PER_MIN_LIMIT - minCount), day: 0 },
    }
  }
  if (minCount >= PER_MIN_LIMIT) {
    const secsToNextMin = 60 - Math.floor((now % 60_000) / 1000)
    return {
      ok: false,
      limitedBy: 'minute',
      retryAfter: secsToNextMin,
      remaining: { minute: 0, day: Math.max(0, PER_DAY_LIMIT - dayCount) },
    }
  }

  // Increment (parallel write — TTL self-cleanup)
  await Promise.all([
    env.RATE_LIMIT.put(minKey, String(minCount + 1), { expirationTtl: 90 }),
    env.RATE_LIMIT.put(dayKey, String(dayCount + 1), { expirationTtl: 90_000 }),
  ])

  return {
    ok: true,
    limitedBy: null,
    retryAfter: 0,
    remaining: {
      minute: Math.max(0, PER_MIN_LIMIT - minCount - 1),
      day:    Math.max(0, PER_DAY_LIMIT - dayCount - 1),
    },
  }
}
