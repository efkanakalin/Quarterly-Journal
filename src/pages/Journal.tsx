import { useEffect } from 'react'
import { useTradesStore } from '@/stores/useTradesStore'
import { CsvUpload } from '@/components/journal/CsvUpload'
import { TradeTable } from '@/components/journal/TradeTable'

export function Journal() {
  const fetchTrades = useTradesStore(s => s.fetchTrades)

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
    </div>
  )
}
