import Papa from 'papaparse'
import { fromZonedTime } from 'date-fns-tz'
import type { CsvRow } from '@/types'
import { buildTradeFromPair, type TradeInsertPayload } from '@/lib/trades/buildTradeFromPair'

const SOURCE_TZ = 'Europe/Istanbul'

export function parseCsvFile(file: File): Promise<TradeInsertPayload[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(`CSV okunamadı: ${results.errors[0].message}`))
          return
        }

        const normalized = results.data.map(row => normalizeRow(row))

        if (normalized.length > 0) {
          const firstRow = normalized[0]
          const required = ['symbol', 'boughtTimestamp', 'soldTimestamp', 'pnl', 'qty']
          const missing = required.filter(k => !(k in firstRow))
          if (missing.length > 0) {
            const cols = Object.keys(firstRow).join(', ')
            reject(new Error(
              `Eksik sütunlar: ${missing.join(', ')}\nCSV'deki sütunlar: ${cols}\n` +
              `Tradovate → Reports → Performance sekmesinden indirdiğinizden emin olun.`
            ))
            return
          }
        }

        try {
          const trades = normalized.map((row, i) => {
            try {
              return parseCsvRow(row as unknown as CsvRow)
            } catch (e) {
              throw new Error(`Satır ${i + 2}: ${e instanceof Error ? e.message : String(e)}`)
            }
          })
          resolve(trades)
        } catch (err) {
          reject(err)
        }
      },
      error: (err) => reject(new Error(`CSV parse hatası: ${err.message}`)),
    })
  })
}

/**
 * Tradovate PNL formatlarını sayıya çevirir:
 *   "$1.50"    → 1.5
 *   "$(28.75)" → -28.75   (parantez = negatif, muhasebe formatı)
 *   "-28.75"   → -28.75
 */
function parsePnl(raw: string): number {
  if (!raw) return NaN
  const s = raw.trim()
  if (s.startsWith('$(') || s.startsWith('(')) {
    const num = parseFloat(s.replace(/[$(),]/g, ''))
    return isNaN(num) ? NaN : -num
  }
  return parseFloat(s.replace(/[$,]/g, ''))
}

/**
 * Tradovate duration formatlarını saniyeye çevirir:
 *   "6min 51sec"  → 411
 *   "1hr 2min 3sec" → 3723
 *   "HH:MM:SS"    → normal
 */
function parseDuration(raw: string | undefined): number | null {
  if (!raw) return null
  const s = raw.trim()

  if (s.includes('min') || s.includes('hr') || s.includes('sec')) {
    let total = 0
    const hr  = s.match(/(\d+)hr/)
    const min = s.match(/(\d+)min/)
    const sec = s.match(/(\d+)sec/)
    if (hr)  total += parseInt(hr[1])  * 3600
    if (min) total += parseInt(min[1]) * 60
    if (sec) total += parseInt(sec[1])
    return total || null
  }

  const parts = s.split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60  + parts[1]

  return null
}

/**
 * Tradovate timestamp "04/20/2026 16:32:08" → "2026-04-20T16:32:08"
 */
function toIsoLike(ts: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(ts)) return ts.replace(' ', 'T')

  const m = ts.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}:\d{2}:\d{2})$/)
  if (m) return `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}T${m[4]}`

  return ts
}

function normalizeRow(row: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(row)) {
    out[k.trim()] = v?.trim() ?? ''
  }
  return out
}

function parseCsvRow(row: CsvRow): TradeInsertPayload {
  const symbolRaw = row.symbol?.trim() ?? ''
  if (!symbolRaw) throw new Error('symbol boş')

  const pnl = parsePnl(row.pnl)
  if (isNaN(pnl)) throw new Error(`pnl geçersiz: "${row.pnl}"`)

  const qty = parseInt(row.qty)
  if (isNaN(qty)) throw new Error(`qty geçersiz: "${row.qty}"`)

  const boughtRaw = row.boughtTimestamp?.trim()
  const soldRaw   = row.soldTimestamp?.trim()
  if (!boughtRaw) throw new Error('boughtTimestamp boş')
  if (!soldRaw)   throw new Error('soldTimestamp boş')

  // Tradovate Performance.csv timestamp'leri Türkiye saatindedir → UTC'ye çevir.
  let entryUtc: Date
  let exitUtc:  Date
  try {
    entryUtc = fromZonedTime(toIsoLike(boughtRaw), SOURCE_TZ)
    exitUtc  = fromZonedTime(toIsoLike(soldRaw),   SOURCE_TZ)
  } catch {
    throw new Error(`Timestamp parse edilemedi: "${boughtRaw}"`)
  }
  if (isNaN(entryUtc.getTime())) throw new Error(`Geçersiz giriş zamanı: "${boughtRaw}"`)
  if (isNaN(exitUtc.getTime()))  throw new Error(`Geçersiz çıkış zamanı: "${soldRaw}"`)

  const buyPrice  = parseFloat((row.buyPrice  ?? '').replace(/[$,]/g, ''))
  const sellPrice = parseFloat((row.sellPrice ?? '').replace(/[$,]/g, ''))

  return buildTradeFromPair({
    symbolRaw,
    qty,
    buyPrice:     isNaN(buyPrice)  ? null : buyPrice,
    sellPrice:    isNaN(sellPrice) ? null : sellPrice,
    pnlUsd:       pnl,
    boughtUtcIso: entryUtc.toISOString(),
    soldUtcIso:   exitUtc.toISOString(),
    durationSec:  parseDuration(row.duration),
    buyFillId:    row.buyFillId  ?? '',
    sellFillId:   row.sellFillId ?? '',
    source:       'csv',
  })
}
