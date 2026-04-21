import { useState } from 'react'
import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { PairBadge } from './PairBadge'
import { OutcomeBadge } from './OutcomeBadge'
import { SessionBadge } from './SessionBadge'
import { ConfirmationChips } from './ConfirmationChips'
import { TradeDetailPanel } from './TradeDetailPanel'
import { DeleteTradeDialog } from './DeleteTradeDialog'
import { TradeWizard } from './wizard/TradeWizard'
import { useTradesStore } from '@/stores/useTradesStore'
import { S } from '@/lib/constants/strings'
import type { TradeWithRelations } from '@/types'

export function TradeTable() {
  const { trades, loading, deleteTrade } = useTradesStore()
  const [detailTrade, setDetailTrade] = useState<TradeWithRelations | null>(null)
  const [wizardTrade, setWizardTrade] = useState<TradeWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [nextPromptOpen, setNextPromptOpen] = useState(false)
  const [completedId, setCompletedId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteTrade(deleteTarget)
      toast.success('İşlem silindi.')
    } catch {
      toast.error('Silme işlemi başarısız.')
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
          <div key={i} className="h-12 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-gray-500 dark:text-[#9ca3af]">{S.journal.noTrades}</p>
        <p className="text-sm text-gray-400 dark:text-[#9ca3af]">{S.journal.noTradesHint}</p>
      </div>
    )
  }

  return (
    <>
      {/* Scrollable table container — CR-03 */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 max-h-[calc(100vh-280px)] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white dark:bg-[#1a1a1a]">
            <tr className="border-b border-gray-200 dark:border-white/10 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#9ca3af] min-w-[80px]">{S.journal.pair}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#9ca3af] min-w-[80px]">{S.journal.result}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#9ca3af] min-w-[140px]">{S.journal.date}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#9ca3af] min-w-[90px]">{S.journal.session}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#9ca3af] min-w-[80px]">{S.journal.time}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#9ca3af] min-w-[320px]">{S.journal.confirmation}</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-[#9ca3af] w-[100px]">{S.journal.actions}</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const entryTime = trade.entry_time_et ? new Date(trade.entry_time_et) : null
              return (
                <tr
                  key={trade.id}
                  onClick={() => setDetailTrade(trade)}
                  className="border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-[#9ca3af]">
                        {trade.source === 'csv' ? '📥' : '✏️'}
                      </span>
                      <PairBadge symbol={trade.symbol} />
                      {!trade.is_complete && (
                        <span className="text-xs text-yellow-500" title={S.journal.incomplete}>⚠</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <OutcomeBadge outcome={trade.outcome} />
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {entryTime ? format(entryTime, 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <SessionBadge session={trade.session} />
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-mono">
                    {entryTime ? format(entryTime, 'HH:mm') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ConfirmationChips confirmations={trade.trade_confirmations} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => openWizard(trade, e)}
                        className="rounded p-1.5 text-gray-400 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white transition-colors"
                        title="Düzenle"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(trade.id)}
                        className="rounded p-1.5 text-gray-400 dark:text-[#9ca3af] hover:bg-red-50 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        title="Sil"
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

      <TradeDetailPanel trade={detailTrade} open={!!detailTrade} onClose={() => setDetailTrade(null)} />

      {wizardTrade && (
        <TradeWizard
          trade={wizardTrade}
          open={!!wizardTrade}
          onClose={() => setWizardTrade(null)}
          onComplete={handleWizardComplete}
        />
      )}

      <DeleteTradeDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {nextPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-6 space-y-4 shadow-xl">
            <p className="text-gray-900 dark:text-white text-sm font-medium">Sıradaki eksik işleme geç?</p>
            <p className="text-xs text-gray-500 dark:text-[#9ca3af]">
              {trades.filter(t => !t.is_complete && t.source === 'csv').length} eksik işlem kaldı.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setNextPromptOpen(false); setCompletedId(null) }}
                className="px-4 py-2 text-sm text-gray-500 dark:text-[#9ca3af] hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                Hayır
              </button>
              <button
                onClick={goToNextIncomplete}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Evet, geç
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
