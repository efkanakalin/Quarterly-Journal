import type { TradeWithRelations } from '@/types'

export interface TradeGroup {
  id: string
  primary: TradeWithRelations
  trades: TradeWithRelations[]
  totalPnl: number | null
  count: number
}

const DEFAULT_WINDOW_MS = 2 * 60 * 1000

/**
 * Aynı sembolde, ardışık trade'ler arası gap `windowMs`'i aşmıyorsa tek grup.
 * Scaling-in/out senaryosunda 1-2 dk arayla açılan partial'lar tek satır olarak
 * sunulsun diye kullanılır. Çıktı sırası primary.entry_time_et'e göre azalan.
 */
export function groupNearbyTrades(
  trades: TradeWithRelations[],
  windowMs: number = DEFAULT_WINDOW_MS,
): TradeGroup[] {
  if (trades.length === 0) return []

  const sortedAsc = [...trades].sort((a, b) => {
    const ta = a.entry_time_et ? new Date(a.entry_time_et).getTime() : 0
    const tb = b.entry_time_et ? new Date(b.entry_time_et).getTime() : 0
    return ta - tb
  })

  const openBySymbol = new Map<string, TradeWithRelations[]>()
  const all: TradeWithRelations[][] = []

  for (const t of sortedAsc) {
    const tTime = t.entry_time_et ? new Date(t.entry_time_et).getTime() : 0
    const key = t.symbol
    if (!key || !tTime) {
      all.push([t])
      continue
    }
    const open = openBySymbol.get(key)
    if (open) {
      const last = open[open.length - 1]
      const lastTime = last.entry_time_et ? new Date(last.entry_time_et).getTime() : 0
      if (lastTime && tTime - lastTime <= windowMs) {
        open.push(t)
        continue
      }
    }
    const fresh = [t]
    openBySymbol.set(key, fresh)
    all.push(fresh)
  }

  const groups: TradeGroup[] = all.map(g => {
    const primary = g[0]
    const allHavePnl = g.every(x => x.pnl_usd !== null)
    const totalPnl = allHavePnl ? g.reduce((s, x) => s + (x.pnl_usd ?? 0), 0) : null
    return { id: primary.id, primary, trades: g, totalPnl, count: g.length }
  })

  groups.sort((a, b) => {
    const ta = a.primary.entry_time_et ? new Date(a.primary.entry_time_et).getTime() : 0
    const tb = b.primary.entry_time_et ? new Date(b.primary.entry_time_et).getTime() : 0
    return tb - ta
  })

  return groups
}
