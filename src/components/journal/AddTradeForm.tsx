import { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { fromZonedTime } from 'date-fns-tz'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useTradesStore } from '@/stores/useTradesStore'
import { SYMBOL_COLORS, OUTCOME_COLORS, SESSION_COLORS, SESSION_LABELS } from '@/lib/constants/colors'
import { CONFIRMATION_TYPES, CONFIRMATION_COLORS } from '@/lib/constants/confirmations'
import { TIMEFRAMES } from '@/lib/constants/timeframes'
import { SYMBOLS_LIST } from '@/lib/constants/symbols'
import { deriveSession, deriveSessionQuarter, deriveMicroQuarter90m } from '@/lib/derivations/session'
import { deriveWeekOfYear, deriveMonthQuarter, deriveYearQuarter, deriveDayOfWeek } from '@/lib/derivations/quarter'
import { S } from '@/lib/constants/strings'
import type { Outcome, Session, Timeframe, ConfirmationType, TradeWithRelations } from '@/types'

const SESSIONS = Object.keys(SESSION_LABELS) as Session[]
const OUTCOMES: Outcome[] = ['win', 'loss', 'breakeven']
const OUTCOME_LABELS: Record<Outcome, string> = {
  win: S.outcome.win, loss: S.outcome.loss, breakeven: S.outcome.breakeven,
}

interface PendingConf {
  timeframe: Timeframe
  confirmation_type: ConfirmationType
}

interface Props { onClose: () => void }

const INPUT = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL = 'text-xs font-medium text-gray-600 dark:text-[#9ca3af]'

export function AddTradeForm({ onClose }: Props) {
  const { addTrade } = useTradesStore()

  const [symbol, setSymbol] = useState('')
  const [outcome, setOutcome] = useState<Outcome | ''>('')
  const [date, setDate] = useState('')
  const [session, setSession] = useState<Session | ''>('')
  const [time, setTime] = useState('')
  const [pnl, setPnl] = useState('')
  const [chartLink, setChartLink] = useState('')
  const [notes, setNotes] = useState('')

  const [pendingConfs, setPendingConfs] = useState<PendingConf[]>([])
  const [confTf, setConfTf] = useState<Timeframe>('15M')
  const [confType, setConfType] = useState<ConfirmationType>('SSMT')
  const [saving, setSaving] = useState(false)

  const addConf = () => {
    if (pendingConfs.some(c => c.timeframe === confTf && c.confirmation_type === confType)) return
    setPendingConfs(p => [...p, { timeframe: confTf, confirmation_type: confType }])
  }

  const buildEntryUtc = (): Date | null => {
    if (!date) return null
    return fromZonedTime(`${date}T${time || '12:00'}:00`, 'America/New_York')
  }

  const handleSave = async () => {
    if (!symbol || !outcome || !date) {
      toast.error('Sembol, Sonuç ve Tarih zorunludur.')
      return
    }
    setSaving(true)
    try {
      const entryUtc = buildEntryUtc()
      const sym = SYMBOLS_LIST.find(s => s.code === symbol)
      const contractClass = sym?.class ?? 'micro'

      const derivedSession = entryUtc && !session ? deriveSession(entryUtc) : (session || null)
      const resolvedSession = derivedSession as Session | null

      const pnlNum = pnl ? parseFloat(pnl) : null

      const payload = {
        symbol_raw: symbol, symbol,
        contract_class: contractClass,
        direction: null, qty: null,
        entry_price: null, exit_price: null,
        entry_time_et: entryUtc?.toISOString() ?? null,
        exit_time_et: null,
        pnl_usd: pnlNum,
        duration_sec: null,
        session: resolvedSession,
        day_of_week: entryUtc ? deriveDayOfWeek(entryUtc) : null,
        session_quarter: entryUtc && resolvedSession ? deriveSessionQuarter(entryUtc, resolvedSession) : null,
        micro_quarter_90m: entryUtc && resolvedSession ? deriveMicroQuarter90m(entryUtc, resolvedSession) : null,
        week_of_year: entryUtc ? deriveWeekOfYear(entryUtc) : null,
        month_quarter: entryUtc ? deriveMonthQuarter(entryUtc) : null,
        year_quarter: entryUtc ? deriveYearQuarter(entryUtc) : null,
        outcome: outcome as Outcome,
        r_multiple: null,
        chart_link: chartLink || null,
        notes: notes || null,
        source: 'manual' as const,
        is_complete: true,
        csv_fingerprint: null,
      }

      const { data: tradeData, error: tradeError } = await supabase.from('trades').insert(payload).select().single()
      if (tradeError) throw tradeError

      let savedConfs: TradeWithRelations['trade_confirmations'] = []
      if (pendingConfs.length > 0) {
        const { data: confData, error: confError } = await supabase
          .from('trade_confirmations')
          .insert(pendingConfs.map(c => ({ trade_id: tradeData.id, timeframe: c.timeframe, confirmation_type: c.confirmation_type })))
          .select()
        if (confError) throw confError
        savedConfs = confData ?? []
      }

      addTrade({ ...tradeData, trade_confirmations: savedConfs, trade_mistakes: [] } as TradeWithRelations)
      toast.success('Manuel işlem eklendi.')
      onClose()
    } catch {
      toast.error('İşlem eklenemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-blue-500/30 bg-white dark:bg-[#1a1a1a] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">Yeni Manuel İşlem</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Row 1: Sembol + Sonuç + Tarih */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className={LABEL}>Sembol <span className="text-red-500">*</span></label>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} className={INPUT}>
            <option value="">Seç...</option>
            {SYMBOLS_LIST.map(s => (
              <option key={s.code} value={s.code} style={{ color: SYMBOL_COLORS[s.code] ?? '#111' }}>
                {s.code}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>Sonuç <span className="text-red-500">*</span></label>
          <select
            value={outcome}
            onChange={e => setOutcome(e.target.value as Outcome)}
            className={INPUT}
            style={{ color: outcome ? OUTCOME_COLORS[outcome as Outcome] : undefined }}
          >
            <option value="">Seç...</option>
            {OUTCOMES.map(o => (
              <option key={o} value={o} style={{ color: OUTCOME_COLORS[o] }}>{OUTCOME_LABELS[o]}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>Tarih <span className="text-red-500">*</span></label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT + ' [color-scheme:light] dark:[color-scheme:dark]'} />
        </div>
      </div>

      {/* Row 2: Seans + Saat + PNL */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className={LABEL}>Seans</label>
          <select value={session} onChange={e => setSession(e.target.value as Session)} className={INPUT} style={{ color: session ? SESSION_COLORS[session] : undefined }}>
            <option value="">Opsiyonel</option>
            {SESSIONS.map(s => <option key={s} value={s} style={{ color: SESSION_COLORS[s] }}>{SESSION_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>Saat (ET)</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={INPUT + ' [color-scheme:light] dark:[color-scheme:dark]'} />
        </div>
        <div className="space-y-1">
          <label className={LABEL}>Kar/Zarar ($)</label>
          <input type="number" step="0.01" value={pnl} onChange={e => setPnl(e.target.value)} placeholder="örn. 37.50" className={INPUT} />
        </div>
      </div>

      {/* Row 3: Chart Link + Notlar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={LABEL}>📎 Chart Linki</label>
          <input type="url" value={chartLink} onChange={e => setChartLink(e.target.value)} placeholder="https://tradingview.com/..." className={INPUT} />
        </div>
        <div className="space-y-1">
          <label className={LABEL}>Notlar</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="İsteğe bağlı not..." className={INPUT} />
        </div>
      </div>

      {/* Konfirmasyonlar */}
      <div className="space-y-2">
        <label className={LABEL}>Konfirmasyonlar</label>
        <div className="flex items-center gap-2">
          <select value={confTf} onChange={e => setConfTf(e.target.value as Timeframe)} className={INPUT + ' !w-auto'}>
            {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
          </select>
          <select value={confType} onChange={e => setConfType(e.target.value as ConfirmationType)} className={INPUT + ' flex-1'}>
            {CONFIRMATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={addConf} className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {pendingConfs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pendingConfs.map((c, idx) => {
              const color = CONFIRMATION_COLORS[c.confirmation_type] ?? '#9ca3af'
              return (
                <span key={idx} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${color}22`, color }}>
                  {c.timeframe} {c.confirmation_type}
                  <button onClick={() => setPendingConfs(p => p.filter((_, i) => i !== idx))} className="ml-1 hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-[#9ca3af] dark:hover:text-white transition-colors">
          {S.journal.cancelButton}
        </button>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
          <Check className="h-4 w-4" />
          {saving ? 'Kaydediliyor...' : S.journal.saveButton}
        </button>
      </div>
    </div>
  )
}
