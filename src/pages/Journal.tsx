import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTradesStore } from '@/stores/useTradesStore'
import { CsvUpload } from '@/components/journal/CsvUpload'
import { TradeTable } from '@/components/journal/TradeTable'
import { CalendarView } from '@/components/journal/CalendarView'
import { AddTradeForm } from '@/components/journal/AddTradeForm'
import { S } from '@/lib/constants/strings'

type Tab = 'list' | 'calendar'

export function Journal() {
  const fetchTrades = useTradesStore(s => s.fetchTrades)
  const [tab, setTab] = useState<Tab>('list')
  const [addingRow, setAddingRow] = useState(false)

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{S.journal.title}</h1>
        <div className="flex gap-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-1">
          {(['list', 'calendar'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setAddingRow(false) }}
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

      {tab === 'list' && (
        <>
          <CsvUpload />

          {/* CR-02: Add Row butonu tablonun ÜSTÜNDE */}
          {addingRow ? (
            <AddTradeForm onClose={() => setAddingRow(false)} />
          ) : (
            <button
              onClick={() => setAddingRow(true)}
              className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-white/20 px-4 py-2.5 text-sm text-gray-500 dark:text-[#9ca3af] hover:border-gray-400 dark:hover:border-white/40 hover:text-gray-700 dark:hover:text-white transition-colors w-full justify-center"
            >
              <Plus className="h-4 w-4" />
              {S.journal.addRow}
            </button>
          )}

          <TradeTable />
        </>
      )}

      {tab === 'calendar' && <CalendarView />}
    </div>
  )
}
