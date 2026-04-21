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
import { useTradesStore } from '@/stores/useTradesStore'
import type { TradeWithRelations } from '@/types'

export function TradeTable() {
  const { trades, loading, deleteTrade } = useTradesStore()
  const [selectedTrade, setSelectedTrade] = useState<TradeWithRelations | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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
                  onClick={() => setSelectedTrade(trade)}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#9ca3af]">
                        {trade.source === 'csv' ? '📥' : '✏️'}
                      </span>
                      <PairBadge symbol={trade.symbol} />
                      {!trade.is_complete && (
                        <span className="text-xs text-yellow-400">⚠</span>
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
                        onClick={() => setSelectedTrade(trade)}
                        className="rounded p-1.5 text-[#9ca3af] hover:bg-white/10 hover:text-white transition-colors"
                        title="Düzenle"
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
        trade={selectedTrade}
        open={!!selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />

      <DeleteTradeDialog
        open={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
