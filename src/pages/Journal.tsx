import { useEffect } from 'react'
import { useTradesStore } from '@/stores/useTradesStore'
import { CsvUpload } from '@/components/journal/CsvUpload'

export function Journal() {
  const { trades, loading, fetchTrades } = useTradesStore()

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Journal</h1>
      </div>

      <CsvUpload />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </div>
      ) : trades.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-[#9ca3af]">Henüz trade yok.</p>
          <p className="text-sm text-[#9ca3af]">Yukarıdan Tradovate Performance.csv yükleyin.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
          <p className="text-sm text-[#9ca3af]">{trades.length} trade yüklendi — Sprint 3'te liste görünümü gelecek.</p>
        </div>
      )}
    </div>
  )
}
