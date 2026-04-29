import type { Strings } from '@/lib/i18n'

/**
 * "5 minutes ago" / "2 hours ago" / "3 days ago" gibi relative bir
 * timestamp etiketi üretir. UI'da "Last synced X" formatında kullanılır.
 */
export function formatRelativeTime(iso: string | null | undefined, S: Strings): string {
  if (!iso) return S.brokers.never
  const then = new Date(iso).getTime()
  if (isNaN(then)) return S.brokers.never

  const diffMs = Date.now() - then
  const seconds = Math.max(0, Math.floor(diffMs / 1000))
  if (seconds < 60) return S.brokers.relTimeJustNow

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return S.brokers.relTimeMinutes(minutes)

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return S.brokers.relTimeHours(hours)

  const days = Math.floor(hours / 24)
  return S.brokers.relTimeDays(days)
}
