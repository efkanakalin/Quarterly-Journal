export function fmtClock(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    hour:     '2-digit',
    minute:   '2-digit',
    hour12:   false,
  }).format(d)
}

export function fmtCountdown(targetIso: string | null, nowMs = Date.now()): string {
  if (!targetIso) return '—'
  const diff = new Date(targetIso).getTime() - nowMs
  if (!Number.isFinite(diff)) return '—'
  if (diff <= 0) return 'now'
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${mins % 60}m`
  return `${mins}m`
}

const FLAGS: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭',
  CAD: '🇨🇦', AUD: '🇦🇺', NZD: '🇳🇿', CNY: '🇨🇳', CNH: '🇨🇳',
}

export function flag(currency: string): string {
  return FLAGS[currency?.toUpperCase()] ?? ''
}

/** Stable short id from arbitrary string (FNV-1a 32-bit hex). */
export function stableId(input: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
