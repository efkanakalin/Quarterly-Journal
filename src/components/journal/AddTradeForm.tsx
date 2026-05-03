import { useEffect, useMemo, useState } from 'react'
import { Plus, X, Check, ClipboardPaste } from 'lucide-react'
import { fromZonedTime } from 'date-fns-tz'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { sanitizeUrl } from '@/lib/security/url'
import { useTradesStore } from '@/stores/useTradesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUserPrefsStore } from '@/stores/useUserPrefsStore'
import { SYMBOL_COLORS, OUTCOME_COLORS, SESSION_COLORS, SESSION_LABELS } from '@/lib/constants/colors'
import { CONFIRMATION_COLORS, CONFIRMATION_NEEDS_TIMEFRAME, CONFIRMATIONS } from '@/lib/constants/confirmations'
import { sortByTimeframe } from '@/lib/constants/timeframes'
import { SYMBOLS_LIST } from '@/lib/constants/symbols'
import { deriveSession, deriveSessionQuarter, deriveMicroQuarter90m } from '@/lib/derivations/session'
import { deriveWeekOfYear, deriveMonthQuarter, deriveYearQuarter, deriveDayOfWeek } from '@/lib/derivations/quarter'
import { useS } from '@/lib/i18n'
import type { Outcome, Session, Timeframe, ConfirmationType, TradeWithRelations } from '@/types'

const SESSIONS = Object.keys(SESSION_LABELS) as Session[]
const OUTCOMES: Outcome[] = ['win', 'loss', 'breakeven']
const NO_TF_VALUE = '__NONE__'

interface PendingConf {
  timeframe: Timeframe | null
  confirmation_type: ConfirmationType
}

interface Props { onClose: () => void }

const INPUT = 'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-blue-500'
const LABEL = 'text-xs font-medium text-gray-600 dark:text-[#9ca3af]'

export function AddTradeForm({ onClose }: Props) {
  const S = useS()
  const { addTrade } = useTradesStore()
  const user = useAuthStore(s => s.user) // FIX: user_id için
  const enabledSymbols       = useUserPrefsStore(s => s.enabledSymbols)
  const enabledConfirmations = useUserPrefsStore(s => s.enabledConfirmations)
  const enabledTimeframes    = useUserPrefsStore(s => s.enabledTimeframes)
  const customConfirmations  = useUserPrefsStore(s => s.customConfirmations)
  const customSymbols        = useUserPrefsStore(s => s.customSymbols)

  const filteredSymbols = useMemo(() => {
    const builtIn = SYMBOLS_LIST.filter(s => enabledSymbols.includes(s.code))
    const customAsSymbols = customSymbols
      .filter(code => enabledSymbols.includes(code))
      .map(code => ({ code, name: code, category: 'index' as const }))
    return [...builtIn, ...customAsSymbols]
  }, [enabledSymbols, customSymbols])
  const availableConfs = useMemo(() => {
    const builtIn = CONFIRMATIONS.filter(c => enabledConfirmations.includes(c.type))
    // Custom labels: enabled olanları (toggle ile seçilmişler) + tüm custom'lar — formda göster
    const customAsConfs = customConfirmations
      .filter(label => enabledConfirmations.includes(label as ConfirmationType))
      .map(label => ({
        type: label as ConfirmationType,
        group: 'CUSTOM' as const,
        needsTimeframe: true,
      }))
    return [...builtIn, ...customAsConfs]
  }, [enabledConfirmations, customConfirmations])

  const [symbol,    setSymbol]    = useState('')
  const [outcome,   setOutcome]   = useState<Outcome | ''>('')
  const [date,      setDate]      = useState('')
  const [session,   setSession]   = useState<Session | ''>('')
  const [time,      setTime]      = useState('')
  const [pnl,       setPnl]       = useState('')
  const [chartLink, setChartLink] = useState('')
  const [notes,     setNotes]     = useState('')

  const [pendingConfs, setPendingConfs] = useState<PendingConf[]>([])
  const [confTf,       setConfTf]       = useState<Timeframe | null>(() => enabledTimeframes[0] ?? '15M')
  const [confType,     setConfType]     = useState<ConfirmationType>(() => availableConfs[0]?.type ?? 'SSMT')
  const [saving,       setSaving]       = useState(false)

  // Keep confType valid as user toggles prefs
  useEffect(() => {
    if (!availableConfs.find(c => c.type === confType)) {
      setConfType(availableConfs[0]?.type ?? 'SSMT')
    }
  }, [availableConfs, confType])

  // Auto-clear TF for confluences that don't need one
  useEffect(() => {
    if (CONFIRMATION_NEEDS_TIMEFRAME[confType] === false) setConfTf(null)
  }, [confType])

  const confNeedsTf = CONFIRMATION_NEEDS_TIMEFRAME[confType] !== false

  const OUTCOME_LABELS: Record<Outcome, string> = {
    win: S.outcome.win, loss: S.outcome.loss, breakeven: S.outcome.breakeven,
  }

  // Sadece + butonu ekler — otomatik ekleme yok (Madde 4)
  const addConf = () => {
    const already = pendingConfs.some(c => c.timeframe === confTf && c.confirmation_type === confType)
    if (!already) {
      setPendingConfs(p => [...p, { timeframe: confTf, confirmation_type: confType }])
    }
  }

  // Paste shortcut
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
    if (!user?.id) {
      toast.error('Not authenticated.')
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
        user_id: user.id, // FIX: RLS için zorunlu
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
        r_multiple: null, chart_link: sanitizeUrl(chartLink), notes: notes || null,
        source: 'manual' as const, is_complete: true, csv_fingerprint: null,
      }

      const { data: tradeData, error: tradeError } = await supabase
        .from('trades').insert(payload).select().single()
      if (tradeError) throw new Error(tradeError.message)

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
    <div className="rounded-t-xl sm:rounded-xl border border-blue-500/30 bg-white dark:bg-[#1a1a1a] p-4 space-y-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">{S.journal.addRow}</span>
        <button tabIndex={-1} onClick={onClose} className="rounded-md p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Pair + Result + Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.pair} <span className="text-red-500">*</span></label>
          <select tabIndex={1} value={symbol} onChange={e => setSymbol(e.target.value)} className={INPUT}>
            <option value="">{S.journal.pair === 'Pair' ? 'Select...' : 'Seç...'}</option>
            {(filteredSymbols.length > 0 ? filteredSymbols : SYMBOLS_LIST).map(s => (
              <option key={s.code} value={s.code} style={{ color: SYMBOL_COLORS[s.code] ?? '#111' }}>{s.code}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.result} <span className="text-red-500">*</span></label>
          <select tabIndex={2} value={outcome} onChange={e => setOutcome(e.target.value as Outcome)} className={INPUT} style={{ color: outcome ? OUTCOME_COLORS[outcome as Outcome] : undefined }}>
            <option value="">{S.journal.result === 'Result' ? 'Select...' : 'Seç...'}</option>
            {OUTCOMES.map(o => <option key={o} value={o} style={{ color: OUTCOME_COLORS[o] }}>{OUTCOME_LABELS[o]}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.date} <span className="text-red-500">*</span></label>
          {/* Madde 2: tüm kutuya tıklayınca calendar açılır, appearance kaldırıldı */}
          <input
            tabIndex={3}
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            onClick={e => { try { (e.target as HTMLInputElement).showPicker() } catch {} }}
            className={INPUT + ' cursor-pointer [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute'}
          />
        </div>
      </div>

      {/* Session + Time + PNL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.session}</label>
          <select tabIndex={4} value={session} onChange={e => setSession(e.target.value as Session)} className={INPUT} style={{ color: session ? SESSION_COLORS[session] : undefined }}>
            <option value="">{S.journal.result === 'Result' ? 'Optional' : 'Opsiyonel'}</option>
            {SESSIONS.map(s => <option key={s} value={s} style={{ color: SESSION_COLORS[s] }}>{SESSION_LABELS[s]}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.journal.time} (ET)</label>
          <input tabIndex={5} type="time" value={time} onChange={e => setTime(e.target.value)} className={INPUT + ' [color-scheme:light] dark:[color-scheme:dark]'} />
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.dashboard.pnl} ($)</label>
          <input tabIndex={6} type="number" step="0.01" value={pnl} onChange={e => setPnl(e.target.value)} placeholder="37.50" className={INPUT} />
        </div>
      </div>

      {/* Chart Link + Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={LABEL}>📎 Chart Link</label>
          <div className="flex gap-1">
            <input tabIndex={7} type="url" value={chartLink} onChange={e => setChartLink(e.target.value)} placeholder="https://tradingview.com/..." className={INPUT} />
            <button tabIndex={-1} onClick={handlePasteChartLink} title="Paste" className="shrink-0 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-2.5 text-gray-500 hover:text-blue-500 transition-colors">
              <ClipboardPaste className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <label className={LABEL}>{S.wizard.notesTitle}</label>
          <input tabIndex={8} type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder={S.wizard.notesPlaceholder} className={INPUT} />
        </div>
      </div>

      {/* Confluences — sadece + ile ekleme (Madde 4) */}
      <div className="space-y-2">
        <label className={LABEL}>{S.journal.confluence}</label>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            tabIndex={9}
            value={confTf ?? NO_TF_VALUE}
            onChange={e => {
              const v = e.target.value
              setConfTf(v === NO_TF_VALUE ? null : (v as Timeframe))
            }}
            disabled={!confNeedsTf}
            className={INPUT + ' !w-auto' + (confNeedsTf ? '' : ' opacity-40 cursor-not-allowed')}
          >
            <option value={NO_TF_VALUE}>—</option>
            {enabledTimeframes.map(tf => <option key={tf} value={tf}>{tf}</option>)}
          </select>
          <select
            tabIndex={10}
            value={confType}
            onChange={e => setConfType(e.target.value as ConfirmationType)}
            className={INPUT + ' flex-1 min-w-0'}
          >
            {(availableConfs.length > 0 ? availableConfs : CONFIRMATIONS).map(c => (
              <option key={c.type} value={c.type}>
                {c.type}{c.needsTimeframe ? '' : ' (no TF)'}
              </option>
            ))}
          </select>
          {/* Madde 4: + butonu renkli */}
          <button
            tabIndex={11}
            onClick={addConf}
            title="Add confluence"
            className="flex items-center gap-1 rounded-lg bg-blue-500 hover:bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors"
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
                  {c.timeframe ? `${c.timeframe} ` : ''}{c.confirmation_type}
                  <button tabIndex={-1} onClick={() => setPendingConfs(p => p.filter((_, i) => i !== origIdx))} className="ml-1 hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button tabIndex={-1} onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-[#9ca3af] dark:hover:text-white transition-colors">
          {S.journal.cancelButton}
        </button>
        <button tabIndex={12} onClick={handleSave} disabled={saving} className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
          <Check className="h-4 w-4" />
          {saving ? '...' : S.journal.saveButton}
        </button>
      </div>
    </div>
  )
}
