import { useState } from 'react'
import { formatET } from '@/lib/formatET'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { PairBadge } from './PairBadge'
import { OutcomeBadge } from './OutcomeBadge'
import { SessionBadge } from './SessionBadge'
import { ConfirmationChips } from './ConfirmationChips'
import { TradeDetailPanel } from './TradeDetailPanel'
import { DeleteTradeDialog } from './DeleteTradeDialog'
import { TradeWizard } from './wizard/TradeWizard'
import { useTradesStore } from '@/stores/useTradesStore'
import { useS } from '@/lib/i18n'
import type { TradeWithRelations } from '@/types'

export function TradeTable() {
  const { trades, loading, deleteTrade } = useTradesStore()
  const [detailTrade, setDetailTrade] = useState<TradeWithRelations | null>(null)
  const [wizardTrade, setWizardTrade] = useState<TradeWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [nextPromptOpen, setNextPromptOpen] = useState(false)
  const [completedId, setCompletedId] = useState<string | null>(null)
  const S = useS()

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTrade(deleteTarget)
      toast.success('Trade deleted.')
    } catch {
      toast.error('Delete failed.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const openWizard = (trade: TradeWithRelations, e: React.MouseEvent) => {
    e.stopPropagation()
    if (trade.source === 'csv') setWizardTrade(trade)
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

  return (
    <>
      {/* +%20 genişlik, 15 satır görünür, tema uyumlu scrollbar */}
      <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[960px] scrollbar-light dark:scrollbar-dark">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-[#161616]">
              <tr className="border-b-2 border-gray-200 dark:border-white/10 text-left">
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] min-w-[132px]">{S.journal.pair}</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] min-w-[108px]">{S.journal.result}</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] min-w-[168px]">{S.journal.date}</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] min-w-[114px]">{S.journal.session}</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] min-w-[96px]">{S.journal.time}</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] min-w-[336px]">{S.journal.confluence}</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] min-w-[264px]">{S.journal.notes}</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] min-w-[72px]">{S.journal.link}</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-500 dark:text-[#9ca3af] w-[108px]"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1a1a1a]">
              {trades.map(trade => {
                const entryRaw = trade.entry_time_et ?? null
                return (
                  <tr
                    key={trade.id}
                    onClick={() => setDetailTrade(trade)}
                    className="border-b border-gray-100 dark:border-white/8 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{trade.source === 'csv' ? '📥' : '✏️'}</span>
                        <PairBadge symbol={trade.symbol} />
                        {!trade.is_complete && (
                          <span className="text-xs text-yellow-500" title={S.journal.incomplete}>⚠</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4"><OutcomeBadge outcome={trade.outcome} /></td>
                    <td className="px-4 py-4 text-gray-900 dark:text-white text-sm">
                      {entryRaw ? formatET(entryRaw, 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="px-4 py-4"><SessionBadge session={trade.session} /></td>
                    <td className="px-4 py-4 text-gray-900 dark:text-white font-mono text-sm">
                      {entryRaw ? formatET(entryRaw, 'HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <ConfirmationChips confirmations={trade.trade_confirmations} />
                    </td>
                    {/* Notes sütunu — max 2 satır (Madde 1) */}
                    <td className="px-4 py-4 min-w-[220px] max-w-[280px]">
                      {trade.notes ? (
                        <p className="text-xs text-gray-600 dark:text-[#9ca3af] leading-relaxed line-clamp-2">
                          {trade.notes}
                        </p>
                      ) : (
                        <span className="text-gray-300 dark:text-white/20">—</span>
                      )}
                    </td>
                    {/* Chart Link sütunu */}
                    <td className="px-4 py-4">
                      {trade.chart_link ? (
                        <a
                          href={trade.chart_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 hover:underline font-medium"
                        >
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-300 dark:text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={e => openWizard(trade, e)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(trade.id)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
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
