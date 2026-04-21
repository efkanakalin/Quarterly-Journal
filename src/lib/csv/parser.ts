import Papa from 'papaparse'
import { fromZonedTime } from 'date-fns-tz'
import type { CsvRow, Trade } from '@/types'
import { buildFingerprint } from './fingerprint'
import { cleanSymbol, getContractClass } from '@/lib/derivations/symbol'
import { deriveDirection } from '@/lib/derivations/direction'
import { deriveOutcome } from '@/lib/derivations/outcome'
import { deriveSession, deriveSessionQuarter, deriveMicroQuarter90m } from '@/lib/derivations/session'
import { deriveWeekOfYear, deriveMonthQuarter, deriveYearQuarter, deriveDayOfWeek } from '@/lib/derivations/quarter'

const SOURCE_TZ = 'Europe/Istanbul'

export function parseCsvFile(file: File): Promise<Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const trades = results.data.map(row => parseCsvRow(row))
          resolve(trades)
        } catch (err) {
          reject(err)
        }
      },
      error: (err) => reject(err),
    })
  })
}

function parseCsvRow(row: CsvRow): Omit<Trade, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  const symbolRaw = row.symbol?.trim() ?? ''
  const symbol    = cleanSymbol(symbolRaw)
  const contractClass = getContractClass(symbol)

  const pnl = parseFloat(row.pnl)
  const qty  = parseInt(row.qty)

  const boughtRaw = row.boughtTimestamp?.trim()
  const soldRaw   = row.soldTimestamp?.trim()

  // Parse Istanbul timestamps → UTC
  const entryUtc = fromZonedTime(boughtRaw, SOURCE_TZ)
  const exitUtc  = fromZonedTime(soldRaw, SOURCE_TZ)

  const direction = deriveDirection(boughtRaw, soldRaw)
  const outcome   = contractClass ? deriveOutcome(pnl, contractClass) : null

  const session       = deriveSession(entryUtc)
  const sessionQuarter = deriveSessionQuarter(entryUtc, session)
  const microQuarter   = deriveMicroQuarter90m(entryUtc, session)
  const weekOfYear     = deriveWeekOfYear(entryUtc)
  const monthQuarter   = deriveMonthQuarter(entryUtc)
  const yearQuarter    = deriveYearQuarter(entryUtc)
  const dayOfWeek      = deriveDayOfWeek(entryUtc)

  // Duration in seconds
  let durationSec: number | null = null
  if (row.duration) {
    const parts = row.duration.split(':').map(Number)
    if (parts.length === 3) {
      durationSec = parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      durationSec = parts[0] * 60 + parts[1]
    }
  }

  return {
    symbol_raw:        symbolRaw,
    symbol,
    contract_class:    contractClass,
    direction,
    qty,
    entry_price:       parseFloat(row.buyPrice),
    exit_price:        parseFloat(row.sellPrice),
    entry_time_et:     entryUtc.toISOString(),
    exit_time_et:      exitUtc.toISOString(),
    pnl_usd:           pnl,
    duration_sec:      durationSec,
    session,
    day_of_week:       dayOfWeek,
    session_quarter:   sessionQuarter,
    micro_quarter_90m: microQuarter,
    week_of_year:      weekOfYear,
    month_quarter:     monthQuarter,
    year_quarter:      yearQuarter,
    outcome,
    r_multiple:        null,
    chart_link:        null,
    notes:             null,
    source:            'csv',
    is_complete:       false,
    csv_fingerprint:   buildFingerprint(row.buyFillId, row.sellFillId),
  }
}
