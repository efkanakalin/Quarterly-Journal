import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTradesStore } from '@/stores/useTradesStore'
import { useIsReadOnly } from '@/stores/useViewerStore'
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
  const readOnly = useIsReadOnly()
  const S = useS()

  useEffect(() => { fetchTrades() }, [fetchTrades])

  return (
    <div className="space-y-4 sm:space-y-6 overflow-x-hidden">
      {/* Büyük ortalanmış başlık */}
      <h1 className="text-center text-3xl sm:text-5xl font-bold text-gray-900 dark:text-white pt-2 sm:pt-6">
        {S.journal.title}
      </h1>

      {/* Kontroller — listenin hemen üstünde */}
      <div className="flex items-center justify-end gap-2 flex-wrap pt-2 sm:pt-4">
        {!readOnly && <CsvUpload compact />}

        {!readOnly && (
          <button
            onClick={() => setAddingRow(true)}
            className="flex items-center gap-2 rounded-lg border border-[#415dff]/40 bg-[#415dff]/10 px-3 py-2 text-xs font-semibold text-[#415dff] dark:text-[#8a9eff] hover:bg-[#415dff]/15 dark:hover:bg-[#415dff]/20 active:scale-95 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            {S.journal.addRow}
          </button>
        )}

        <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-1">
          {(['list', 'calendar'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t) }}
              className={`rounded-md px-3 sm:px-4 py-1.5 text-xs font-medium transition-colors ${
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

      {tab === 'list' && <TradeTable />}
      {tab === 'calendar' && <CalendarView />}

      {/* Add Trade Modal */}
      {addingRow && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <div className="w-full sm:max-w-lg sm:rounded-xl">
            <AddTradeForm onClose={() => setAddingRow(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
