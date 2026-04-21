import { useState } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { fromZonedTime } from 'date-fns-tz'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useTradesStore } from '@/stores/useTradesStore'
import { SYMBOL_COLORS, OUTCOME_COLORS, SESSION_COLORS, SESSION_LABELS } from '@/lib/constants/colors'
import { CONFIRMATION_TYPES, CONFIRMATION_COLORS } from '@/lib/constants/confirmations'
import { TIMEFRAMES } from '@/lib/constants/timeframes'
import { deriveSession, deriveSessionQuarter, deriveMicroQuarter90m } from '@/lib/derivations/session'
import { deriveWeekOfYear, deriveMonthQuarter, deriveYearQuarter, deriveDayOfWeek } from '@/lib/derivations/quarter'
import type { Outcome, Session, Timeframe, ConfirmationType, TradeWithRelations } from '@/types'

const SYMBOLS = Object.keys(SYMBOL_COLORS)
const SESSIONS = Object.keys(SESSION_LABELS) as Session[]
const OUTCOMES: Outcome[] = ['win', 'loss', 'breakeven']
const OUTCOME_LABELS: Record<Outcome, string> = { win: 'WIN', loss: 'LOSS', breakeven: 'BE' }

interface PendingConfirmation {
  timeframe: Timeframe
  confirmation_type: ConfirmationType
}

interface Props {
  onClose: () => void
}

export function AddTradeForm({ onClose }: Props) {
  const { addTrade } = useTradesStore()

  const [symbol, setSymbol] = useState('')
  const [outcome, setOutcome] = useState<Outcome | ''>('')
  const [date, setDate] = useState('')
  const [session, setSession] = useState<Session | ''>('')
  const [time, setTime] = useState('')

  // Confirmation builder
  const [pendingConfs, setPendingConfs] = useState<PendingConfirmation[]>([])
  const [confTf, setConfTf] = useState<Timeframe>('15M')
  const [confType, setConfType] = useState<ConfirmationType>('SSMT')

  const [saving, setSaving] = useState(false)

  const addConf = () => {
    if (pendingConfs.some(c => c.timeframe === confTf && c.confirmation_type === confType)) return
    setPendingConfs(prev => [...prev, { timeframe: confTf, confirmation_type: confType }])
  }

  const removeConf = (idx: number) => {
    setPendingConfs(prev => prev.filter((_, i) => i !== idx))
  }

  const buildEntryUtc = (): Date | null => {
    if (!date) return null
    const timeStr = time || '12:00'
    const localStr = `${date}T${timeStr}:00`
    return fromZonedTime(localStr, 'America/New_York')
  }

  const handleSave = async () => {
    if (!symbol || !outcome || !date) {
      toast.error('Pair, Sonuç ve Tarih zorunludur.')
      return
    }

    setSaving(true)
    try {
      const entryUtc = buildEntryUtc()

      const derivedSession = entryUtc && !session
        ? deriveSession(entryUtc)
        : (session || null)

      const resolvedSession = derivedSession as Session | null

      const entryIso = entryUtc?.toISOString() ?? null

      const tradePayload = {
        symbol_raw: symbol,
        symbol,
        contract_class: ['MNQ', 'MES', 'MYM'].includes(symbol)
          ? ('micro' as const)
          : ('mini' as const),
        direction: null,
        qty: null,
        entry_price: null,
        exit_price: null,
        entry_time_et: entryIso,
        exit_time_et: null,
        pnl_usd: null,
        duration_sec: null,
        session: resolvedSession,
        day_of_week: entryUtc ? deriveDayOfWeek(entryUtc) : null,
        session_quarter: entryUtc && resolvedSession
          ? deriveSessionQuarter(entryUtc, resolvedSession)
          : null,
        micro_quarter_90m: entryUtc && resolvedSession
          ? deriveMicroQuarter90m(entryUtc, resolvedSession)
          : null,
        week_of_year: entryUtc ? deriveWeekOfYear(entryUtc) : null,
        month_quarter: entryUtc ? deriveMonthQuarter(entryUtc) : null,
        year_quarter: entryUtc ? deriveYearQuarter(entryUtc) : null,
        outcome: outcome as Outcome,
        r_multiple: null,
        chart_link: null,
        notes: null,
        source: 'manual' as const,
        is_complete: true,
        csv_fingerprint: null,
      }

      const { data: tradeData, error: tradeError } = await supabase
        .from('trades')
        .insert(tradePayload)
        .select()
        .single()

      if (tradeError) throw tradeError

      let savedConfs: TradeWithRelations['trade_confirmations'] = []
      if (pendingConfs.length > 0) {
        const { data: confData, error: confError } = await supabase
          .from('trade_confirmations')
          .insert(
            pendingConfs.map(c => ({
              trade_id: tradeData.id,
              timeframe: c.timeframe,
              confirmation_type: c.confirmation_type,
            }))
          )
          .select()

        if (confError) throw confError
        savedConfs = confData ?? []
      }

      addTrade({
        ...tradeData,
        trade_confirmations: savedConfs,
        trade_mistakes: [],
      } as TradeWithRelations)

      toast.success('Manuel trade eklendi.')
      onClose()
    } catch {
      toast.error('Trade eklenemedi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-blue-500/30 bg-[#1a1a1a] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">Yeni Manuel Trade</span>
        <button onClick={onClose} className="text-[#9ca3af] hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Row 1: Pair + Sonuç + Tarih (required) */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-[#9ca3af]">Pair <span className="text-red-400">*</span></label>
          <select
            value={symbol}
            onChange={e => setSymbol(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Seç...</option>
            {SYMBOLS.map(s => (
              <option key={s} value={s} style={{ color: SYMBOL_COLORS[s] }}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[#9ca3af]">Sonuç <span className="text-red-400">*</span></label>
          <select
            value={outcome}
            onChange={e => setOutcome(e.target.value as Outcome)}
            className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ color: outcome ? OUTCOME_COLORS[outcome as Outcome] : '#9ca3af' }}
          >
            <option value="" style={{ color: '#9ca3af' }}>Seç...</option>
            {OUTCOMES.map(o => (
              <option key={o} value={o} style={{ color: OUTCOME_COLORS[o] }}>
                {OUTCOME_LABELS[o]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[#9ca3af]">Tarih <span className="text-red-400">*</span></label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Row 2: Session + Saat (optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-[#9ca3af]">Session</label>
          <select
            value={session}
            onChange={e => setSession(e.target.value as Session)}
            className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            style={{ color: session ? SESSION_COLORS[session] : '#9ca3af' }}
          >
            <option value="" style={{ color: '#9ca3af' }}>Opsiyonel</option>
            {SESSIONS.map(s => (
              <option key={s} value={s} style={{ color: SESSION_COLORS[s] }}>
                {SESSION_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-[#9ca3af]">Saat (ET)</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
          />
        </div>
      </div>

      {/* Confirmations */}
      <div className="space-y-2">
        <label className="text-xs text-[#9ca3af]">Konfirmasyonlar</label>
        <div className="flex items-center gap-2">
          <select
            value={confTf}
            onChange={e => setConfTf(e.target.value as Timeframe)}
            className="rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {TIMEFRAMES.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
          <select
            value={confType}
            onChange={e => setConfType(e.target.value as ConfirmationType)}
            className="flex-1 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {CONFIRMATION_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button
            onClick={addConf}
            className="flex items-center gap-1 rounded-md bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {pendingConfs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {pendingConfs.map((c, idx) => {
              const color = CONFIRMATION_COLORS[c.confirmation_type] ?? '#9ca3af'
              return (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                  style={{ backgroundColor: `${color}22`, color }}
                >
                  {c.timeframe} {c.confirmation_type}
                  <button onClick={() => removeConf(idx)} className="ml-1 hover:opacity-70">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
        >
          İptal
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          <Check className="h-4 w-4" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </button>
      </div>
    </div>
  )
}
