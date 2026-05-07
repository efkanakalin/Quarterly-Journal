import { useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { AreaChart, Area, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { FilePlus, Eye, FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatET } from '@/lib/formatET'
import { useTradesStore } from '@/stores/useTradesStore'
import { useLangStore } from '@/stores/useLangStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useS } from '@/lib/i18n'
import { ConfirmationChips } from '@/components/journal/ConfirmationChips'
import { DailyReportPDF } from '@/components/journal/DailyReportPDF'
import { exportNodeToPdf } from '@/lib/pdf/exportDailyReport'
import { mergeIntoLogicalTrades } from '@/lib/trades/mergeGroupedTrades'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { TradeWithRelations } from '@/types'

const NOTE_KEY = (date: string) => `qt-daily-note:${date}`

function loadNote(date: string): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(NOTE_KEY(date)) ?? ''
}

function saveNote(date: string, value: string) {
  if (typeof window === 'undefined') return
  const key = NOTE_KEY(date)
  if (value.trim() === '') window.localStorage.removeItem(key)
  else window.localStorage.setItem(key, value)
}

interface DayGroup {
  date:     string           // yyyy-MM-dd
  label:    string           // "Wed, Sep 21, 2026"
  trades:   TradeWithRelations[]
  netPnl:   number
  winners:  number
  losers:   number
  winrate:  number
  grossPnl: number
  volume:   number
  profitFactor: number
  curve:    { t: number; pnl: number }[]
}

function groupByDay(trades: TradeWithRelations[], locale: typeof tr): DayGroup[] {
  const map: Record<string, TradeWithRelations[]> = {}
  for (const t of trades) {
    if (!t.entry_time_et) continue
    const key = formatET(t.entry_time_et, 'yyyy-MM-dd')
    if (!map[key]) map[key] = []
    map[key].push(t)
  }

  return Object.entries(map)
    .map(([date, rows]) => {
      // Scaling-in partial'ları tek logical trade'e indir; tüm metrikler bunun
      // üzerinden hesaplansın ki kullanıcı 3 partial'ı 3 trade olarak görmesin.
      const merged = mergeIntoLogicalTrades(rows)
      const sorted = [...merged].sort((a, b) =>
        new Date(a.entry_time_et ?? 0).getTime() - new Date(b.entry_time_et ?? 0).getTime()
      )
      const netPnl   = sorted.reduce((s, t) => s + (t.pnl_usd ?? 0), 0)
      const winners  = sorted.filter(t => t.outcome === 'win').length
      const losers   = sorted.filter(t => t.outcome === 'loss').length
      const rated    = winners + losers
      const winrate  = rated === 0 ? 0 : (winners / rated) * 100
      const grossPnl = sorted
        .filter(t => (t.pnl_usd ?? 0) > 0)
        .reduce((s, t) => s + (t.pnl_usd ?? 0), 0)
      const grossLoss = Math.abs(sorted
        .filter(t => (t.pnl_usd ?? 0) < 0)
        .reduce((s, t) => s + (t.pnl_usd ?? 0), 0))
      const profitFactor = grossLoss === 0 ? (grossPnl > 0 ? 99 : 0) : grossPnl / grossLoss
      const volume = sorted.reduce((s, t) => s + (t.qty ?? 0), 0)

      // cumulative curve
      let running = 0
      const curve = sorted
        .filter(t => t.entry_time_et != null)
        .map(t => {
          running += t.pnl_usd ?? 0
          return { t: new Date(t.entry_time_et!).getTime(), pnl: running }
        })

      return {
        date,
        label: format(new Date(`${date}T12:00:00`), 'EEE, MMM d, yyyy', { locale }),
        trades: sorted,
        netPnl, winners, losers, winrate,
        grossPnl, volume, profitFactor, curve,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function DailyStats() {
  const { trades, loading, fetchTrades } = useTradesStore()
  const lang = useLangStore(s => s.lang)
  const S = useS()

  useEffect(() => { fetchTrades() }, [fetchTrades])

  const locale = lang === 'tr' ? tr : enUS
  const days = useMemo(() => groupByDay(trades, locale), [trades, locale])

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (days.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-10 text-center">
        <p className="text-gray-500 dark:text-[#9ca3af]">{S.daily.noTradingDays}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{S.nav.dailyStats}</h1>
      {days.map(day => <DayCard key={day.date} day={day} />)}
    </div>
  )
}

// ---------------------------------------------------------------------------

function DayCard({ day }: { day: DayGroup }) {
  const S = useS()
  const isPos = day.netPnl >= 0

  const [noteOpen, setNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [savedNote, setSavedNote] = useState(() => loadNote(day.date))
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef<HTMLDivElement | null>(null)

  const openNote = () => {
    setNoteDraft(savedNote)
    setNoteOpen(true)
  }

  const commitNote = () => {
    saveNote(day.date, noteDraft)
    setSavedNote(noteDraft)
    setNoteOpen(false)
  }

  const hasNote = savedNote.trim().length > 0

  const handleExportPdf = async () => {
    if (!reportRef.current) return
    setExporting(true)
    try {
      // Wait one frame so the chart inside the hidden template has finished
      // its initial render before we capture.
      await new Promise(r => requestAnimationFrame(() => r(null)))
      await exportNodeToPdf(reportRef.current, `qt-daily-${day.date}.pdf`)
      toast.success('Daily report downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
      {/* Top section */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-white/5 items-center">
        {/* Date + Net P&L + chart */}
        <div className="col-span-12 md:col-span-5 flex items-center gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{day.label}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-[#9ca3af]">
              {S.daily.netPnl}{' '}
              <span className={`font-mono font-semibold ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {isPos ? '+' : ''}${day.netPnl.toFixed(2)}
              </span>
            </p>
          </div>
          <div className="flex-1 h-12 sm:h-14 min-w-[100px] sm:min-w-[140px]">
            <IntradayChart curve={day.curve} positive={isPos} />
          </div>
        </div>

        {/* Metric grid */}
        <div className="col-span-12 md:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 sm:gap-x-5 gap-y-2 text-sm">
          <Metric label={S.daily.totalTrades} value={day.trades.length} />
          <Metric label={S.daily.winners}     value={day.winners} />
          <Metric label={S.daily.grossPnl}    value={`$${day.grossPnl.toFixed(2)}`} />
          <Metric label={S.daily.commissions} value={'$0.00'} />
          <Metric label={S.daily.winrate}     value={`${day.winrate.toFixed(0)}%`} />
          <Metric label={S.daily.losers}      value={day.losers} />
          <Metric label={S.daily.volume}      value={day.volume} />
          <Metric label={S.daily.profitFactor} value={day.profitFactor === 99 ? '∞' : day.profitFactor.toFixed(2)} />
        </div>

        {/* Actions */}
        <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            title="Download PDF report"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-[#9ca3af] dark:hover:bg-white/5"
          >
            {exporting
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <FileDown className="h-3.5 w-3.5" />}
            PDF
          </button>
          <button
            onClick={openNote}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              hasNote
                ? 'border-emerald-300/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300 dark:hover:bg-emerald-400/15'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-[#9ca3af] dark:hover:bg-white/5'
            }`}
          >
            {hasNote ? <Eye className="h-3.5 w-3.5" /> : <FilePlus className="h-3.5 w-3.5" />}
            {hasNote ? S.daily.seeNote : S.daily.writeNote}
          </button>
        </div>
      </div>

      {/* Hidden report template — captured by exporter, never shown to user */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -99999,
          top: 0,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <DailyReportPDF
          ref={reportRef}
          data={{
            date:         day.date,
            label:        day.label,
            trades:       day.trades,
            netPnl:       day.netPnl,
            winners:      day.winners,
            losers:       day.losers,
            winrate:      day.winrate,
            grossPnl:     day.grossPnl,
            volume:       day.volume,
            profitFactor: day.profitFactor,
            curve:        day.curve,
            note:         savedNote,
          }}
        />
      </div>

      {/* Trades table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] table-fixed text-sm">
          <colgroup>
            <col className="w-[13%]" />
            <col className="w-[11%]" />
            <col className="w-[9%]" />
            <col className="w-[11%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead className="bg-gray-50 dark:bg-[#141414]">
            <tr>
              <Th className="text-left">{S.daily.openTime}</Th>
              <Th className="text-left">{S.daily.ticker}</Th>
              <Th className="text-left">{S.daily.side}</Th>
              <Th className="text-center">{S.daily.volume}</Th>
              <Th className="text-center">{S.daily.netPnl}</Th>
              <Th className="text-center">{S.daily.netRoi}</Th>
              <Th className="text-center">{S.daily.rMultiple}</Th>
              <Th className="text-left">{S.daily.tags}</Th>
            </tr>
          </thead>
          <tbody>
            {day.trades.map(t => <TradeRow key={t.id} trade={t} />)}
          </tbody>
        </table>
      </div>

      {/* Note dialog */}
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{S.daily.writeNote} — {day.label}</DialogTitle>
          </DialogHeader>
          <textarea
            autoFocus
            value={noteDraft}
            onChange={e => setNoteDraft(e.target.value)}
            placeholder="How did this session go? What worked, what didn't?"
            className="min-h-[180px] w-full resize-y rounded-lg border border-gray-200 bg-white p-3 text-sm leading-relaxed text-gray-900 outline-none focus:border-gray-400 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white dark:placeholder:text-[#6b7280] dark:focus:border-white/25"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button onClick={commitNote}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function IntradayChart({ curve, positive }: { curve: { t: number; pnl: number }[]; positive: boolean }) {
  const theme = useThemeStore(s => s.theme)
  const isDark = theme === 'dark'
  const stroke = positive ? '#10b981' : '#f43f5e'
  const fill   = positive ? '#10b981' : '#f43f5e'
  const gradientId = `daily-${positive ? 'pos' : 'neg'}-${Math.random().toString(36).slice(2, 7)}`

  if (curve.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={curve} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fill} stopOpacity={isDark ? 0.35 : 0.25} />
            <stop offset="100%" stopColor={fill} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{
            background: isDark ? '#1a1a1a' : '#fff',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            borderRadius: 6, fontSize: 12,
          }}
          labelFormatter={v => format(new Date(Number(v)), 'HH:mm')}
          formatter={v => [`$${Number(v).toFixed(2)}`, 'Cum PnL']}
        />
        <Area
          type="monotone"
          dataKey="pnl"
          stroke={stroke}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 dark:text-[#9ca3af] truncate">{label}</span>
      <span className="font-mono font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  )
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9ca3af] ${className}`}>
      {children}
    </th>
  )
}

function TradeRow({ trade }: { trade: TradeWithRelations }) {
  const entryRaw = trade.entry_time_et ?? null
  const openTime = entryRaw ? formatET(entryRaw, 'HH:mm:ss') : '—'
  const side = trade.direction ? trade.direction.toUpperCase() : '—'
  const pnl = trade.pnl_usd
  const posPnl = pnl !== null && pnl > 0

  // Net ROI ≈ pnl / cost basis
  const cost = (trade.entry_price ?? 0) * (trade.qty ?? 0)
  const roi = (pnl !== null && cost > 0) ? (pnl / cost) * 100 : null

  return (
    <tr className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
      <td className="px-4 py-3 font-mono text-sm text-gray-700 dark:text-[#d1d5db]">{openTime}</td>
      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{trade.symbol ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-[#d1d5db]">{side}</td>
      <td className="px-4 py-3 text-center font-mono text-sm text-gray-900 dark:text-white">{trade.qty ?? '—'}</td>
      <td className="px-4 py-3 text-center font-mono text-sm">
        {pnl !== null ? (
          <span className={posPnl ? 'text-emerald-600 dark:text-emerald-400' : pnl < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-500 dark:text-[#9ca3af]'}>
            {posPnl ? '+' : ''}${pnl.toFixed(2)}
          </span>
        ) : '—'}
      </td>
      <td className="px-4 py-3 text-center font-mono text-sm text-gray-700 dark:text-[#d1d5db]">
        {roi !== null ? `${roi.toFixed(2)}%` : '—'}
      </td>
      <td className="px-4 py-3 text-center font-mono text-sm text-gray-900 dark:text-white">
        {trade.r_multiple != null ? `${trade.r_multiple.toFixed(2)}R` : '—'}
      </td>
      <td className="px-4 py-3">
        <ConfirmationChips confirmations={trade.trade_confirmations} />
      </td>
    </tr>
  )
}
