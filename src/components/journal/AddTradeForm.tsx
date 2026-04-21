import { useState } from 'react'
import { Plus, X, Check, ClipboardPaste } from 'lucide-react'
import { fromZonedTime } from 'date-fns-tz'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useTradesStore } from '@/stores/useTradesStore'
import { SYMBOL_COLORS, OUTCOME_COLORS, SESSION_COLORS, SESSION_LABELS } from '@/lib/constants/colors'
import { CONFIRMATION_TYPES, CONFIRMATION_COLORS } from '@/lib/constants/confirmations'
import { TIMEFRAMES, sortByTimeframe } from '@/lib/constants/timeframes'
import { SYMBOLS_LIST } from '@/lib/constants/symbols'
import { deriveSession, deriveSessionQuarter, deriveMicroQuarter90m } from '@/lib/derivations/session'
import { deriveWeekOfYear, deriveMonthQuarter, deriveYearQuarter, deriveDayOfWeek } from '@/lib/derivations/quarter'
import { useS } from '@/lib/i18n'
import type { Outcome, Session, Timeframe, ConfirmationType, TradeWithRelations } from '@/types'

const SESSIONS = Object.keys(SESSION_LABELS) as Session[]
const OUTCOMES: Outcome[] = ['win', 'loss', 'breakeven']

interface PendingConf {
  timeframe: Timeframe
  confirmation_type: ConfirmationType
}

interface Props { onClose: () => void }

const INPUT = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL = 'text-xs font-medium text-gray-600 dark:text-[#9ca3af]'

export function AddTradeForm({ onClose }: Props) {
  const S = useS()
  const { addTrade } = useTradesStore()

  const [symbol,    setSymbol]    = useState('')
  const [outcome,   setOutcome]   = useState<Outcome | ''>('')
  const [date,      setDate]      = useState('')
  const [session,   setSession]   = useState<Session | ''>('')
  const [time,      setTime]      = useState('')
  const [pnl,       setPnl]       = useState('')
  const [chartLink, setChartLink] = useState('')
  const [notes,     setNotes]     = useState('')

  const [pendingConfs, setPendingConfs] = useState<PendingConf[]>([])
  const [confTf,       setConfTf]       = useState<Timeframe>('15M')
  const [confType,     setConfType]     = useState<ConfirmationType>('SSMT')
  const [saving,       setSaving]       = useState(false)

  const OUTCOME_LABELS: Record<Outcome, string> = {
    win: S.outcome.win, loss: S.outcome.loss, breakeven: S.outcome.breakeven,
  }

  // Auto-add when confluence type changes (Madde 4)
  const handleConfTypeChange = (newType: ConfirmationType) => {
    setConfType(newType)
    const already = pendingConfs.some(c => c.timeframe === confTf && c.confirmation_type === newType)
    if (!already) {
      setPendingConfs(p => [...p, { timeframe: confTf, confirmation_type: newType }])
    }
  }

  // Auto-add when TF changes (Madde 4)
  const handleConfTfChange = (newTf: Timeframe) => {
    setConfTf(newTf)
    const already = pendingConfs.some(c => c.timeframe === newTf && c.confirmation_type === confType)
    if (!already) {
      setPendingConfs(p => [...p, { timeframe: newTf, confirmation_type: confType }])
    }
  }

  // Manual + add (Madde 4) — forces add even if already exists
  const addConf = () => {
    setPendingConfs(p => [...p, { timeframe: confTf, confirmation_type: confType }])
  }

  // Paste shortcut (Madde 3)
  const handlePasteChartLink = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setChartLink(text)
    } catch {
      toast.error('Clipboard access denied')
    }
  }

  const buildEntryUtc = (): Date | null => {
    if (!date) return null
    return fromZonedTime(`${date}T${time || '12:00'}:00`, 'America/New_York')
  }

  const handleSave = async () => {
    if (!symbol || !outcome || !date) {
      toast.error('Pair, Result and Date are required.')
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

      // currency alanı kaldırıldı — migration 003 gerekmeden çalışması için (Madde 5 fix)
      const payload = {
        symbol_raw: symbol, symbol,
        contract_class: contractClass,
        direction: null, qty: null,
        entry_price: null, exit_price: null,
        entry_time_et: entryUtc?.toISOString() ?? null,
        exit_time_et: null, pnl_usd: pnlNum, duration_sec: null,
        session: resolvedSession,
        day_of_week:       entryUtc ? deriveDayOfWeek(entryUtc) : null,
        session_quarter:   entryUtc && resolvedSession ? deriveSessionQuarter(entryUtc, resolvedSession) : null,
        micro_quarter_90m: entryUtc && resolvedSession ? deriveMicroQuarter90m(entryUtc, resolvedSession) : null,
        week_of_year:  entryUtc ? deriveWeekOfYear(entryUtc)   : null,
        month_quarter: entryUtc ? deriveMonthQuarter(entryUtc) : null,
        year_quarter:  entryUtc ? deriveYearQuarter(entryUtc)  : null,
        outcome: outcome as Outcome,
        r_multiple: null, chart_link: chartLink || null, notes: notes || null,
        source: 'manual' as const, is_complete: true, csv_fingerprint: null,
      }

      const { data: tradeData, error: tradeError } = await supabase
        .from('trades').insert(payload).select().single()
      if (tradeError) throw new Error(tradeError.message)

      // Unique pending confs için tekrar filtreleme
      const uniqueConfs = pendingConfs.filter(
        (c, i, arr) => arr.findIndex(x => x.timeframe === c.timeframe && x.confirmation_type === c.confirmation_type) === i
      )

      let savedConfs: TradeWithRelations['trade_confirmations'] = []
      if (uniqueConfs.length > 0) {
        const { data: confData, error: confError } = await supabase
          .from('trade_confirmations')
          .insert(uniqueConfs.map(c => ({ trade_id: tradeData.id, timeframe: c.timeframe, confirmation_type: c.confirmation_type })))
          .select()
        if (confError) throw new Error(confError.message)
        savedConfs = confData ?? []
      }

      addTrade({ ...tradeData, trade_confirmations: savedConfs, trade_mistakes: [] } as TradeWithRelations)
      toast.success('Trade saved.')
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.error('Save trade error:', msg)
      toast.error('Error saving trade', { description: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-blue-500/30 bg-white dark:bg-[#1a1a1a] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">{S.journal.addRow}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Sembol + Sonuç + Tarih */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.pair} <span className="text-red-500">*</span></label>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} className={INPUT}>
            <option value="">{S.journal.pair === 'Pair' ? 'Select...' : 'Seç...'}</option>
            {SYMBOLS_LIST.map(s => (
              <option key={s.code} value={s.code} style={{ color: SYMBOL_COLORS[s.code] ?? '#111' }}>{s.code}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.result} <span className="text-red-500">*</span></label>
          <select value={outcome} onChange={e => setOutcome(e.target.value as Outcome)} className={INPUT} style={{ color: outcome ? OUTCOME_COLORS[outcome as Outcome] : undefined }}>
            <option value="">{S.journal.result === 'Result' ? 'Select...' : 'Seç...'}</option>
            {OUTCOMES.map(o => <option key={o} value={o} style={{ color: OUTCOME_COLORS[o] }}>{OUTCOME_LABELS[o]}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.date} <span className="text-red-500">*</span></label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={INPUT + ' [color-scheme:light] dark:[color-scheme:dark]'} />
        </div>
      </div>

      {/* Seans + Saat + PNL (Madde 2: sadece $) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.session}</label>
          <select value={session} onChange={e => setSession(e.target.value as Session)} className={INPUT} style={{ color: session ? SESSION_COLORS[session] : undefined }}>
            <option value="">{S.journal.result === 'Result' ? 'Optional' : 'Opsiyonel'}</option>
            {SESSIONS.map(s => <option key={s} value={s} style={{ color: SESSION_COLORS[s] }}>{SESSION_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.time} (ET)</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={INPUT + ' [color-scheme:light] dark:[color-scheme:dark]'} />
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.dashboard.pnl} ($)</label>
          {/* Madde 2: sadece $ göster, currency selector yok */}
          <div className="flex items-center gap-1">
            <span className="px-2 py-2 text-sm text-gray-500 dark:text-[#9ca3af] bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">$</span>
            <input type="number" step="0.01" value={pnl} onChange={e => setPnl(e.target.value)} placeholder="37.50" className={INPUT} />
          </div>
        </div>
      </div>

      {/* Chart Link (Madde 3: paste butonu) + Notlar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={LABEL}>📎 Chart Link</label>
          <div className="flex gap-1">
            <input type="url" value={chartLink} onChange={e => setChartLink(e.target.value)} placeholder="https://tradingview.com/..." className={INPUT} />
            <button
              onClick={handlePasteChartLink}
              title="Paste (Ctrl+V)"
              className="shrink-0 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-2.5 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <ClipboardPaste className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.wizard.notesTitle}</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder={S.wizard.notesPlaceholder} className={INPUT} />
        </div>
      </div>

      {/* Confluences (Madde 4: auto-add) */}
      <div className="space-y-2">
        <label className={LABEL}>{S.journal.confluence}</label>
        <div className="flex items-center gap-2">
          <select
            value={confTf}
            onChange={e => handleConfTfChange(e.target.value as Timeframe)}
            className={INPUT + ' !w-auto'}
          >
            {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
          </select>
          <select
            value={confType}
            onChange={e => handleConfTypeChange(e.target.value as ConfirmationType)}
            className={INPUT + ' flex-1'}
          >
            {CONFIRMATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button
            onClick={addConf}
            title="Add another"
            className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-white/10 px-3 py-2 text-sm text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        {pendingConfs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sortByTimeframe([...pendingConfs]).map((c, sortedIdx) => {
              const origIdx = pendingConfs.findIndex(p => p.timeframe === c.timeframe && p.confirmation_type === c.confirmation_type)
              const color = CONFIRMATION_COLORS[c.confirmation_type] ?? '#9ca3af'
              return (
                <span key={sortedIdx} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${color}22`, color }}>
                  {c.timeframe} {c.confirmation_type}
                  <button
                    onClick={() => setPendingConfs(p => p.filter((_, i) => i !== origIdx))}
                    className="ml-1 hover:opacity-70"
                  >
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
          {saving ? '...' : S.journal.saveButton}
        </button>
      </div>
    </div>
  )
}
