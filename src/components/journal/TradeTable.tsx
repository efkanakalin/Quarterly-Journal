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
      toast.success('Trade silindi.')
    } catch {
      toast.error('Silme işlemi başarısız.')
    } finally {
      setDeleteTarget(null)
    }
  }

  const openWizard = (trade: TradeWithRelations, e: React.MouseEvent) => {
    e.stopPropagation()
    if (trade.source === 'csv') {
      setWizardTrade(trade)
    } else {
      setDetailTrade(trade)
    }
  }

  const handleWizardComplete = (tradeId: string) => {
    setCompletedId(tradeId)
    setWizardTrade(null)
    const remaining = trades.filter(t => !t.is_complete && t.id !== tradeId && t.source === 'csv')
    if (remaining.length > 0) {
      setNextPromptOpen(true)
    }
  }

  const handleWizardClose = () => setWizardTrade(null)

  const goToNextIncomplete = () => {
    setNextPromptOpen(false)
    const remaining = trades.filter(
      t => !t.is_complete && t.id !== completedId && t.source === 'csv'
    )
    if (remaining.length > 0) {
      setWizardTrade(remaining[0])
    }
    setCompletedId(null)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5 animate-pulse" />
        ))}
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <p className="text-[#9ca3af]">Henüz trade yok.</p>
        <p className="text-sm text-[#9ca3af]">Yukarıdan Tradovate Performance.csv yükleyin.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-4 py-3 text-xs font-medium text-[#9ca3af]">Pair</th>
              <th className="px-4 py-3 text-xs font-medium text-[#9ca3af]">Sonuç</th>
              <th className="px-4 py-3 text-xs font-medium text-[#9ca3af]">Tarih</th>
              <th className="px-4 py-3 text-xs font-medium text-[#9ca3af]">Session</th>
              <th className="px-4 py-3 text-xs font-medium text-[#9ca3af]">Saat (ET)</th>
              <th className="px-4 py-3 text-xs font-medium text-[#9ca3af]">Konfirme</th>
              <th className="px-4 py-3 text-xs font-medium text-[#9ca3af]"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const entryTime = trade.entry_time_et ? new Date(trade.entry_time_et) : null
              return (
                <tr
                  key={trade.id}
                  onClick={() => setDetailTrade(trade)}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9ca3af]">
                        {trade.source === 'csv' ? '📥' : '✏️'}
                      </span>
                      <PairBadge symbol={trade.symbol} />
                      {!trade.is_complete && (
                        <span className="text-xs text-yellow-400" title="Eksik">⚠</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <OutcomeBadge outcome={trade.outcome} />
                  </td>
                  <td className="px-4 py-3 text-white">
                    {entryTime ? format(entryTime, 'MMM d, yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <SessionBadge session={trade.session} />
                  </td>
                  <td className="px-4 py-3 text-white font-mono">
                    {entryTime ? format(entryTime, 'HH:mm') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ConfirmationChips confirmations={trade.trade_confirmations} />
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => openWizard(trade, e)}
                        className="rounded p-1.5 text-[#9ca3af] hover:bg-white/10 hover:text-white transition-colors"
                        title="Wizard"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(trade.id)}
                        className="rounded p-1.5 text-[#9ca3af] hover:bg-red-500/20 hover:text-red-400 transition-colors"
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

      <TradeDetailPanel
        trade={detailTrade}
        open={!!detailTrade}
        onClose={() => setDetailTrade(null)}
      />

      {wizardTrade && (
        <TradeWizard
          trade={wizardTrade}
          open={!!wizardTrade}
          onClose={handleWizardClose}
          onComplete={handleWizardComplete}
        />
      )}

      <DeleteTradeDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Next incomplete trade prompt */}
      {nextPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#1a1a1a] p-6 space-y-4 shadow-xl">
            <p className="text-white text-sm font-medium">Sıradaki eksik trade'e geç?</p>
            <p className="text-xs text-[#9ca3af]">
              {trades.filter(t => !t.is_complete && t.source === 'csv').length} eksik trade kaldı.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setNextPromptOpen(false); setCompletedId(null) }}
                className="px-4 py-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
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
