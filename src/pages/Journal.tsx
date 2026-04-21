import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTradesStore } from '@/stores/useTradesStore'
import { CsvUpload } from '@/components/journal/CsvUpload'
import { TradeTable } from '@/components/journal/TradeTable'
import { AddTradeForm } from '@/components/journal/AddTradeForm'

export function Journal() {
  const fetchTrades = useTradesStore(s => s.fetchTrades)
  const [addingRow, setAddingRow] = useState(false)

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Journal</h1>
      </div>

      <CsvUpload />
      <TradeTable />

      {addingRow ? (
        <AddTradeForm onClose={() => setAddingRow(false)} />
      ) : (
        <button
          onClick={() => setAddingRow(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-4 py-3 text-sm text-[#9ca3af] hover:border-white/40 hover:text-white transition-colors w-full justify-center"
        >
          <Plus className="h-4 w-4" />
          Add Row
        </button>
      )}
    </div>
  )
}
