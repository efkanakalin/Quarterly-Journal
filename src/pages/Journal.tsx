import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTradesStore } from '@/stores/useTradesStore'
import { CsvUpload } from '@/components/journal/CsvUpload'
import { TradeTable } from '@/components/journal/TradeTable'
import { CalendarView } from '@/components/journal/CalendarView'
import { AddTradeForm } from '@/components/journal/AddTradeForm'

type Tab = 'list' | 'calendar'

export function Journal() {
  const fetchTrades = useTradesStore(s => s.fetchTrades)
  const [tab, setTab] = useState<Tab>('list')
  const [addingRow, setAddingRow] = useState(false)

  useEffect(() => {
    fetchTrades()
  }, [fetchTrades])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Journal</h1>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-lg border border-white/10 bg-[#1a1a1a] p-1">
          {(['list', 'calendar'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setAddingRow(false) }}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === t ? 'bg-white/10 text-white' : 'text-[#9ca3af] hover:text-white'
              }`}
            >
              {t === 'list' ? 'Liste' : 'Takvim'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'list' && (
        <>
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
        </>
      )}

      {tab === 'calendar' && <CalendarView />}
    </div>
  )
}
