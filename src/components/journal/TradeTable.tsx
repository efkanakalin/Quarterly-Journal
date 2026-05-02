import { useEffect, useRef, useState } from 'react'
import { fromZonedTime } from 'date-fns-tz'
import { formatET } from '@/lib/formatET'
import { Pencil, Trash2, ExternalLink, Eye, EyeOff, Check, X, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import { PairBadge } from './PairBadge'
import { OutcomeBadge } from './OutcomeBadge'
import { SessionBadge } from './SessionBadge'
import { ConfirmationChips } from './ConfirmationChips'
import { TradeDetailPanel } from './TradeDetailPanel'
import { DeleteTradeDialog } from './DeleteTradeDialog'
import { TradeWizard } from './wizard/TradeWizard'
import { supabase } from '@/lib/supabase'
import { deriveOutcome } from '@/lib/derivations/outcome'
import { useTradesStore } from '@/stores/useTradesStore'
import { useIsReadOnly } from '@/stores/useViewerStore'
import { useS } from '@/lib/i18n'
import { SYMBOLS_LIST } from '@/lib/constants/symbols'
import { JOURNAL_COLUMNS, normalizedColumnWidths, type JournalColumnId } from '@/lib/constants/journalColumns'
import { useUserPrefsStore } from '@/stores/useUserPrefsStore'
import { SESSION_LABELS } from '@/lib/constants/colors'
import type { Outcome, Session, Trade, TradeWithRelations } from '@/types'

type EditField =
  | 'symbol' | 'outcome' | 'pnl_usd'
  | 'date'   | 'session' | 'time'
  | 'notes'  | 'chart_link'

const SESSION_KEYS = Object.keys(SESSION_LABELS) as Session[]
const OUTCOMES: Outcome[] = ['win', 'loss', 'breakeven']
const OUTCOME_LABEL: Record<Outcome, string> = { win: 'WIN', loss: 'STOP', breakeven: 'B/E' }

export function TradeTable() {
  const { trades, loading, deleteTrade, updateTrade } = useTradesStore()
  const readOnly = useIsReadOnly()
  const enabledSymbols = useUserPrefsStore(s => s.enabledSymbols)
  const enabledColumns = useUserPrefsStore(s => s.enabledColumns)
  const symbolOptions = SYMBOLS_LIST.filter(s => enabledSymbols.length === 0 || enabledSymbols.includes(s.code))
  const colVisible = (id: JournalColumnId) => enabledColumns.includes(id)
  const visibleColIds = JOURNAL_COLUMNS.map(c => c.id).filter(colVisible)
  const colWidths = normalizedColumnWidths(visibleColIds)
  const [detailTrade, setDetailTrade] = useState<TradeWithRelations | null>(null)
  const [wizardTrade, setWizardTrade] = useState<TradeWithRelations | null>(null)
  const [wizardStep, setWizardStep] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [nextPromptOpen, setNextPromptOpen] = useState(false)
  const [completedId, setCompletedId] = useState<string | null>(null)
  const [pnlHidden,   setPnlHidden]   = useState<boolean>(() => localStorage.getItem('qt-pnl-hidden')   === '1')
  const [notesHidden, setNotesHidden] = useState<boolean>(() => localStorage.getItem('qt-notes-hidden') === '1')

  const [editing, setEditing] = useState<{ id: string; field: EditField } | null>(null)
  const [selected, setSelected] = useState<{ id: string; field: EditField } | null>(null)
  const [draft, setDraft] = useState<string>('')

  const S = useS()

  // Esc ile inline edit/seçim iptal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditing(null)
        setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Dışarıya tıklanınca seçim temizlensin
  useEffect(() => {
    if (!selected) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-editable-cell]')) setSelected(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [selected])

  const togglePnl = () => {
    setPnlHidden(h => {
      const next = !h
      localStorage.setItem('qt-pnl-hidden', next ? '1' : '0')
      return next
    })
  }

  const toggleNotes = () => {
    setNotesHidden(h => {
      const next = !h
      localStorage.setItem('qt-notes-hidden', next ? '1' : '0')
      return next
    })
  }

  const performDelete = async (id: string) => {
    try { await deleteTrade(id); toast.success('Trade deleted.') }
    catch { toast.error('Delete failed.') }
  }

  const handleDelete = async (snoozeToday: boolean) => {
    if (!deleteTarget) return
    if (snoozeToday) localStorage.setItem('qt-delete-snooze-until', String(Date.now() + 24 * 60 * 60 * 1000))
    const id = deleteTarget
    setDeleteTarget(null)
    await performDelete(id)
  }

  const requestDelete = (id: string) => {
    const raw = localStorage.getItem('qt-delete-snooze-until')
    const snoozeUntil = raw ? parseInt(raw, 10) : 0
    if (snoozeUntil && Date.now() < snoozeUntil) { performDelete(id); return }
    setDeleteTarget(id)
  }

  const openWizardAt = (trade: TradeWithRelations, step: number) => {
    if (trade.source === 'csv') { setWizardStep(step); setWizardTrade(trade) }
    else setDetailTrade(trade)
  }

  const handleWizardComplete = (tradeId: string) => {
    setCompletedId(tradeId)
    setWizardTrade(null)
    const remaining = trades.filter(t => !t.is_complete && t.id !== tradeId && t.source === 'csv')
    if (remaining.length > 0) setNextPromptOpen(true)
  }

  const goToNextIncomplete = () => {
    setNextPromptOpen(false)
    const remaining = trades.filter(t => !t.is_complete && t.id !== completedId && t.source === 'csv')
    if (remaining.length > 0) setWizardTrade(remaining[0])
    setCompletedId(null)
  }

  // ---- Inline edit helpers ---------------------------------------------

  const startEdit = (trade: TradeWithRelations, field: EditField) => {
    let initial = ''
    switch (field) {
      case 'symbol':     initial = trade.symbol ?? ''; break
      case 'outcome':    initial = trade.outcome ?? ''; break
      case 'pnl_usd':    initial = trade.pnl_usd != null ? String(trade.pnl_usd) : ''; break
      case 'date':       initial = trade.entry_time_et ? formatET(trade.entry_time_et, 'yyyy-MM-dd') : ''; break
      case 'time':       initial = trade.entry_time_et ? formatET(trade.entry_time_et, 'HH:mm') : ''; break
      case 'session':    initial = trade.session ?? ''; break
      case 'notes':      initial = trade.notes ?? ''; break
      case 'chart_link': initial = trade.chart_link ?? ''; break
    }
    setDraft(initial)
    setEditing({ id: trade.id, field })
  }

  const commitEdit = (trade: TradeWithRelations) => {
    if (!editing) return
    const field = editing.field
    const currentDraft = draft
    const updates: Partial<Trade> = {}

    if (field === 'symbol') updates.symbol = currentDraft || null
    else if (field === 'outcome') updates.outcome = (currentDraft || null) as Outcome | null
    else if (field === 'pnl_usd') {
      const n = parseFloat(currentDraft)
      const v = Number.isFinite(n) ? n : null
      updates.pnl_usd = v
      if (v !== null) updates.outcome = deriveOutcome(v)
    }
    else if (field === 'session') updates.session = (currentDraft || null) as Session | null
    else if (field === 'notes') updates.notes = currentDraft || null
    else if (field === 'chart_link') updates.chart_link = currentDraft || null
    else if (field === 'date' || field === 'time') {
      const existingDate = trade.entry_time_et ? formatET(trade.entry_time_et, 'yyyy-MM-dd') : null
      const existingTime = trade.entry_time_et ? formatET(trade.entry_time_et, 'HH:mm')      : null
      const d = field === 'date' ? currentDraft : existingDate
      const t = field === 'time' ? currentDraft : existingTime
      if (!d || !t) { setEditing(null); return }
      updates.entry_time_et = fromZonedTime(`${d}T${t}:00`, 'America/New_York').toISOString()
    }

    // Sync UI — editor kapansın, local store hemen güncellensin
    setEditing(null)
    updateTrade(trade.id, updates)

    // DB sync async
    supabase.from('trades').update(updates).eq('id', trade.id).then(({ error }) => {
      if (error) toast.error('Güncellenemedi.')
    })
  }

  const isEditing = (tradeId: string, field: EditField) =>
    editing?.id === tradeId && editing.field === field

  const isSelected = (tradeId: string, field: EditField) =>
    selected?.id === tradeId && selected.field === field && !isEditing(tradeId, field)

  const handleCellClick = (trade: TradeWithRelations, field: EditField) => {
    if (readOnly) return
    if (isEditing(trade.id, field)) return
    setSelected({ id: trade.id, field })
  }

  const handleCellDoubleClick = (trade: TradeWithRelations, field: EditField) => {
    if (readOnly) return
    setSelected(null)
    startEdit(trade, field)
  }

  // ---- Render ----------------------------------------------------------

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-gray-200 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a]">
        <p className="text-gray-500 dark:text-[#9ca3af]">{S.journal.noTrades}</p>
        <p className="text-sm text-gray-400 dark:text-[#9ca3af]">{S.journal.noTradesHint}</p>
      </div>
    )
  }

  const cellBase =
    'px-3 cursor-pointer hover:bg-gray-100/60 dark:hover:bg-white/8 transition-colors relative'
  const selectionRing =
    'ring-2 ring-inset ring-blue-400/50 dark:ring-blue-300/50 bg-blue-50/30 dark:bg-blue-400/5'

  const cellCls = (tradeId: string, field: EditField, extra = '') =>
    `${cellBase} ${isSelected(tradeId, field) ? selectionRing : ''} ${extra}`

  const thCls =
    'px-3 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] text-center'

  return (
    <>
      {/* Mobile card view */}
      <div className="md:hidden space-y-2.5">
        {trades.map(trade => {
          const entryRaw = trade.entry_time_et ?? null
          return (
            <div
              key={trade.id}
              onClick={() => { if (!readOnly) openWizardAt(trade, 1) }}
              className={`rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-3.5 space-y-2.5 transition-transform ${
                readOnly ? '' : 'active:scale-[0.99] cursor-pointer'
              }`}
            >
              {/* Header — pair, outcome, pnl */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <PairBadge symbol={trade.symbol} />
                  <OutcomeBadge outcome={trade.outcome} />
                </div>
                <div className="font-mono text-sm font-semibold shrink-0">
                  {trade.pnl_usd === null ? (
                    <span className="text-gray-300 dark:text-white/20">—</span>
                  ) : pnlHidden ? (
                    <span className="text-gray-400 dark:text-[#6b7280]">***</span>
                  ) : (
                    <span className={trade.pnl_usd >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {trade.pnl_usd >= 0 ? '+' : ''}${trade.pnl_usd.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Meta — date, time, session */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-[#9ca3af]">
                {entryRaw && (
                  <>
                    <span>{formatET(entryRaw, 'MMM d, yyyy')}</span>
                    <span className="opacity-40">•</span>
                    <span className="font-mono">{formatET(entryRaw, 'HH:mm')}</span>
                  </>
                )}
                {trade.session && (
                  <>
                    <span className="opacity-40">•</span>
                    <SessionBadge session={trade.session} />
                  </>
                )}
              </div>

              {/* Confirmations */}
              {trade.trade_confirmations && trade.trade_confirmations.length > 0 && (
                <ConfirmationChips confirmations={trade.trade_confirmations} />
              )}

              {/* Notes */}
              {trade.notes && !notesHidden && (
                <p className="text-xs text-gray-600 dark:text-[#9ca3af] leading-relaxed line-clamp-2">
                  {trade.notes}
                </p>
              )}

              {/* Footer — chart link + actions */}
              <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 dark:border-white/5">
                {trade.chart_link ? (
                  <a
                    href={trade.chart_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    {S.journal.chart} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span />
                )}
                {!readOnly && (
                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => openWizardAt(trade, 1)}
                      className="rounded-md px-2.5 py-1.5 text-white text-xs"
                      style={{ backgroundColor: '#415dff' }}
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => requestDelete(trade.id)}
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-y-auto overflow-x-hidden max-h-[960px] scrollbar-light dark:scrollbar-dark">
          <table className="w-full text-sm table-fixed">
            <colgroup>
              <col style={{ width: '40px' }} />
              {visibleColIds.map(id => (
                <col key={id} style={{ width: `${colWidths[id]}%` }} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#161616]">
              <tr className="border-b-2 border-gray-200 dark:border-white/10">
                <th className={thCls} aria-hidden="true"></th>
                {colVisible('pair')    && <th className={thCls}>{S.journal.pair}</th>}
                {colVisible('result')  && <th className={thCls}>{S.journal.result}</th>}
                {colVisible('pnl')     && (
                  <th className={thCls}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{S.journal.pnl}</span>
                      <button
                        type="button"
                        onClick={togglePnl}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        title={pnlHidden ? 'Show PnL' : 'Hide PnL'}
                      >
                        {pnlHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </th>
                )}
                {colVisible('date')    && <th className={thCls}>{S.journal.date}</th>}
                {colVisible('session') && <th className={thCls}>{S.journal.session}</th>}
                {colVisible('time')    && <th className={thCls}>{S.journal.time}</th>}
                {colVisible('confluence') && <th className={thCls}>{S.journal.confluence}</th>}
                {colVisible('notes')   && (
                  <th className={thCls}>
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{S.journal.notes}</span>
                      <button
                        type="button"
                        onClick={toggleNotes}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        title={notesHidden ? 'Show notes' : 'Hide notes'}
                      >
                        {notesHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </th>
                )}
                {colVisible('chart')   && <th className={thCls}>{S.journal.chart}</th>}
                {colVisible('actions') && <th className={thCls}></th>}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1a1a1a]">
              {trades.map(trade => {
                const entryRaw = trade.entry_time_et ?? null
                return (
                  <tr key={trade.id} className="group border-b border-gray-100 dark:border-white/8 last:border-0 h-[100px] align-middle">
                    <td className="p-0 align-middle">
                      <button
                        onClick={() => setDetailTrade(trade)}
                        aria-label={S.journal.openSummary}
                        title={S.journal.openSummary}
                        className="mx-auto flex h-7 w-7 items-center justify-center rounded-md text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700 dark:text-[#6b7280] dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    {colVisible('pair') && (
                      <td
                        data-editable-cell
                        className={cellCls(trade.id, 'symbol', 'text-center')}
                        onClick={() => handleCellClick(trade, 'symbol')}
                        onDoubleClick={() => handleCellDoubleClick(trade, 'symbol')}
                      >
                        {isEditing(trade.id, 'symbol') ? (
                          <SelectEditor
                            value={draft}
                            onChange={setDraft}
                            onCommit={() => commitEdit(trade)}
                            onCancel={() => setEditing(null)}
                            saving={false}
                            options={[{ label: '—', value: '' }, ...symbolOptions.map(s => ({ label: s.code, value: s.code }))]}
                          />
                        ) : (
                          <PairBadge symbol={trade.symbol} />
                        )}
                      </td>
                    )}

                    {colVisible('result') && (
                      <td
                        data-editable-cell
                        className={cellCls(trade.id, 'outcome', 'text-center')}
                        onClick={() => handleCellClick(trade, 'outcome')}
                        onDoubleClick={() => handleCellDoubleClick(trade, 'outcome')}
                      >
                        {isEditing(trade.id, 'outcome') ? (
                          <SelectEditor
                            value={draft}
                            onChange={setDraft}
                            onCommit={() => commitEdit(trade)}
                            onCancel={() => setEditing(null)}
                            saving={false}
                            options={[{ label: '—', value: '' }, ...OUTCOMES.map(o => ({ label: OUTCOME_LABEL[o], value: o }))]}
                          />
                        ) : (
                          <OutcomeBadge outcome={trade.outcome} />
                        )}
                      </td>
                    )}

                    {colVisible('pnl') && (
                      <td
                        data-editable-cell
                        className={
                          pnlHidden
                            ? 'px-3 text-center font-mono text-sm relative'
                            : cellCls(trade.id, 'pnl_usd', 'text-center font-mono text-sm')
                        }
                        onClick={() => { if (!pnlHidden) handleCellClick(trade, 'pnl_usd') }}
                        onDoubleClick={() => { if (!pnlHidden) handleCellDoubleClick(trade, 'pnl_usd') }}
                      >
                        {isEditing(trade.id, 'pnl_usd') ? (
                          <TextEditor
                            type="number"
                            value={draft}
                            onChange={setDraft}
                            onCommit={() => commitEdit(trade)}
                            onCancel={() => setEditing(null)}
                            saving={false}
                          />
                        ) : trade.pnl_usd === null ? (
                          <span className="text-gray-300 dark:text-white/20">—</span>
                        ) : pnlHidden ? (
                          <span className="text-gray-400 dark:text-[#6b7280]">***</span>
                        ) : (
                          <span className={trade.pnl_usd >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                            {trade.pnl_usd >= 0 ? '+' : ''}${trade.pnl_usd.toFixed(2)}
                          </span>
                        )}
                      </td>
                    )}

                    {colVisible('date') && (
                      <td
                        data-editable-cell
                        className={cellCls(trade.id, 'date', 'text-center text-gray-900 dark:text-white text-sm')}
                        onClick={() => handleCellClick(trade, 'date')}
                        onDoubleClick={() => handleCellDoubleClick(trade, 'date')}
                      >
                        {isEditing(trade.id, 'date') ? (
                          <TextEditor
                            type="date"
                            value={draft}
                            onChange={setDraft}
                            onCommit={() => commitEdit(trade)}
                            onCancel={() => setEditing(null)}
                            saving={false}
                          />
                        ) : (
                          entryRaw ? formatET(entryRaw, 'MMM d, yyyy') : '—'
                        )}
                      </td>
                    )}

                    {colVisible('session') && (
                      <td
                        data-editable-cell
                        className={cellCls(trade.id, 'session', 'text-center')}
                        onClick={() => handleCellClick(trade, 'session')}
                        onDoubleClick={() => handleCellDoubleClick(trade, 'session')}
                      >
                        {isEditing(trade.id, 'session') ? (
                          <SelectEditor
                            value={draft}
                            onChange={setDraft}
                            onCommit={() => commitEdit(trade)}
                            onCancel={() => setEditing(null)}
                            saving={false}
                            options={[{ label: '—', value: '' }, ...SESSION_KEYS.map(s => ({ label: SESSION_LABELS[s], value: s }))]}
                          />
                        ) : (
                          <SessionBadge session={trade.session} />
                        )}
                      </td>
                    )}

                    {colVisible('time') && (
                      <td
                        data-editable-cell
                        className={cellCls(trade.id, 'time', 'text-center text-gray-900 dark:text-white font-mono text-sm')}
                        onClick={() => handleCellClick(trade, 'time')}
                        onDoubleClick={() => handleCellDoubleClick(trade, 'time')}
                      >
                        {isEditing(trade.id, 'time') ? (
                          <TextEditor
                            type="time"
                            value={draft}
                            onChange={setDraft}
                            onCommit={() => commitEdit(trade)}
                            onCancel={() => setEditing(null)}
                            saving={false}
                          />
                        ) : (
                          entryRaw ? formatET(entryRaw, 'HH:mm') : '—'
                        )}
                      </td>
                    )}

                    {colVisible('confluence') && (
                      <td
                        className={`${cellBase} text-center`}
                        onClick={() => { if (!readOnly) openWizardAt(trade, 1) }}
                      >
                        <ConfirmationChips confirmations={trade.trade_confirmations} />
                      </td>
                    )}

                    {colVisible('notes') && (
                      <td
                        data-editable-cell
                        className={
                          notesHidden
                            ? 'px-3 text-center relative'
                            : cellCls(trade.id, 'notes', 'text-center')
                        }
                        onClick={() => { if (!notesHidden) handleCellClick(trade, 'notes') }}
                        onDoubleClick={() => { if (!notesHidden) handleCellDoubleClick(trade, 'notes') }}
                      >
                        {isEditing(trade.id, 'notes') ? (
                          <TextEditor
                            type="text"
                            value={draft}
                            onChange={setDraft}
                            onCommit={() => commitEdit(trade)}
                            onCancel={() => setEditing(null)}
                            saving={false}
                          />
                        ) : notesHidden ? (
                          trade.notes
                            ? <span className="text-gray-400 dark:text-[#6b7280]">***</span>
                            : <span className="text-gray-300 dark:text-white/20">—</span>
                        ) : trade.notes ? (
                          <p className="text-xs text-gray-600 dark:text-[#9ca3af] leading-relaxed line-clamp-3 text-left whitespace-pre-wrap break-words">{trade.notes}</p>
                        ) : (
                          <span className="text-gray-300 dark:text-white/20">—</span>
                        )}
                      </td>
                    )}

                    {colVisible('chart') && (
                      <td
                        data-editable-cell
                        className={cellCls(trade.id, 'chart_link', 'text-center')}
                        onClick={() => { if (!trade.chart_link) handleCellClick(trade, 'chart_link') }}
                        onDoubleClick={() => { if (!trade.chart_link) handleCellDoubleClick(trade, 'chart_link') }}
                      >
                        {isEditing(trade.id, 'chart_link') ? (
                          <TextEditor
                            type="url"
                            value={draft}
                            onChange={setDraft}
                            onCommit={() => commitEdit(trade)}
                            onCancel={() => setEditing(null)}
                            saving={false}
                          />
                        ) : trade.chart_link ? (
                          <a
                            href={trade.chart_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => { e.stopPropagation(); }}
                            onDoubleClick={e => { e.preventDefault(); e.stopPropagation(); startEdit(trade, 'chart_link') }}
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline font-medium"
                            title="Open (double-click to edit)"
                          >
                            {S.journal.chart} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-gray-300 dark:text-white/20">—</span>
                        )}
                      </td>
                    )}

                    {colVisible('actions') && (
                      <td className="px-3">
                        {readOnly ? (
                          <span className="block text-center text-[11px] text-gray-300 dark:text-[#3a3a3a]">—</span>
                        ) : (
                          <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => openWizardAt(trade, 1)}
                              className="inline-flex items-center justify-center rounded-md px-2.5 py-2 text-white shadow-sm transition-colors"
                              style={{ backgroundColor: '#415dff' }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2f4ae6')}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#415dff')}
                              title="Edit (full)"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => requestDelete(trade.id)}
                              className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <TradeDetailPanel trade={detailTrade} open={!!detailTrade} onClose={() => setDetailTrade(null)} />

      {wizardTrade && (
        <TradeWizard
          trade={wizardTrade}
          open={!!wizardTrade}
          onClose={() => setWizardTrade(null)}
          onComplete={handleWizardComplete}
          initialStep={wizardStep}
        />
      )}

      <DeleteTradeDialog open={!!deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      {nextPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-6 space-y-4 shadow-xl">
            <p className="text-gray-900 dark:text-white text-sm font-medium">{S.wizard.nextIncomplete}</p>
            <p className="text-xs text-gray-500 dark:text-[#9ca3af]">
              {S.wizard.nextIncompleteCount(trades.filter(t => !t.is_complete && t.source === 'csv').length)}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setNextPromptOpen(false); setCompletedId(null) }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-[#9ca3af] dark:hover:text-white"
              >
                {S.wizard.no}
              </button>
              <button
                onClick={goToNextIncomplete}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {S.wizard.yes}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// -----------------------------------------------------------------------
// Inline editor sub-components
// -----------------------------------------------------------------------

interface TextEditorProps {
  type: 'text' | 'number' | 'url' | 'date' | 'time'
  value: string
  onChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
  saving: boolean
}

function useOutsideCommit(onCommit: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onCommit()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [onCommit])
  return ref
}

const EDITOR_WRAPPER =
  'absolute left-1 right-1 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 px-1.5 py-1 ' +
  'bg-white dark:bg-[#0f0f0f] border border-blue-400/60 dark:border-blue-300/50 rounded-md shadow-md'

function TextEditor({ type, value, onChange, onCommit, onCancel, saving }: TextEditorProps) {
  const ref = useOutsideCommit(onCommit)
  return (
    <div ref={ref} onClick={e => e.stopPropagation()} className={EDITOR_WRAPPER}>
      <input
        autoFocus
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onCommit() }
          if (e.key === 'Escape') { e.preventDefault(); onCancel() }
        }}
        disabled={saving}
        className="flex-1 min-w-0 bg-transparent px-1 py-1 text-sm text-gray-900 dark:text-white focus:outline-none"
      />
      <button
        onClick={onCommit}
        disabled={saving}
        className="shrink-0 rounded p-1 text-white disabled:opacity-50"
        style={{ backgroundColor: '#415dff' }}
        title="Save"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onCancel}
        className="shrink-0 rounded p-1 text-gray-500 hover:text-gray-700 dark:hover:text-white"
        title="Cancel"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

interface SelectEditorProps {
  value: string
  onChange: (v: string) => void
  onCommit: () => void
  onCancel: () => void
  saving: boolean
  options: { label: string; value: string }[]
}

function SelectEditor({ value, onChange, onCommit, onCancel, saving, options }: SelectEditorProps) {
  const ref = useOutsideCommit(onCommit)
  return (
    <div ref={ref} onClick={e => e.stopPropagation()} className={EDITOR_WRAPPER}>
      <select
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onCommit() }
          if (e.key === 'Escape') { e.preventDefault(); onCancel() }
        }}
        disabled={saving}
        className="flex-1 min-w-0 bg-transparent px-1 py-1 text-sm text-gray-900 dark:text-white focus:outline-none"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <button
        onClick={onCommit}
        disabled={saving}
        className="shrink-0 rounded p-1 text-white disabled:opacity-50"
        style={{ backgroundColor: '#415dff' }}
        title="Save"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onCancel}
        className="shrink-0 rounded p-1 text-gray-500 hover:text-gray-700 dark:hover:text-white"
        title="Cancel"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
