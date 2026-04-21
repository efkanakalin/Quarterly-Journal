import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTradesStore } from '@/stores/useTradesStore'
import { CsvUpload } from '@/components/journal/CsvUpload'
import { TradeTable } from '@/components/journal/TradeTable'
import { CalendarView } from '@/components/journal/CalendarView'
import { AddTradeForm } from '@/components/journal/AddTradeForm'
import { useS } from '@/lib/i18n'

type Tab = 'list' | 'calendar'

export function Journal() {
  const fetchTrades = useTradesStore(s => s.fetchTrades)
  const [tab, setTab] = useState<Tab>('list')
  const [addingRow, setAddingRow] = useState(false)
  const S = useS()

  useEffect(() => { fetchTrades() }, [fetchTrades])

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{S.journal.title}</h1>
        <div className="flex items-center gap-2">
          {/* CSV Import — kompakt buton, sağ üst */}
          <CsvUpload compact />

          {/* Add Trade — küçük kutu butonu (Madde 1) */}
          <button
            onClick={() => setAddingRow(true)}
            className="flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {S.journal.addRow}
          </button>

          {/* Liste / Takvim */}
          <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-1">
            {(['list', 'calendar'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t) }}
                className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                  tab === t
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-[#9ca3af] hover:text-gray-700 dark:hover:text-white'
                }`}
              >
                {t === 'list' ? S.journal.listView : S.journal.calendar}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Madde 1: başlık ile liste arası boşluk */}
      {tab === 'list' && (
        <div className="mt-4">
          <TradeTable />
        </div>
      )}
      {tab === 'calendar' && <CalendarView />}

      {/* Add Trade Modal (Madde 1: kutucuk modal) */}
      {addingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg">
            <AddTradeForm onClose={() => setAddingRow(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
