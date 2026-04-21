import { useDashboardStore, type DateRangeKey } from '@/stores/useDashboardStore'
import { useS } from '@/lib/i18n'

const KEYS: DateRangeKey[] = ['today', 'this_week', 'this_month', 'last_30', 'last_90', 'all']

export function DateRangePicker() {
  const { dateRange, setDateRange } = useDashboardStore()
  const S = useS()

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-1">
      {KEYS.map(key => (
        <button
          key={key}
          onClick={() => setDateRange(key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            dateRange === key
              ? 'bg-blue-500 text-white'
              : 'text-gray-500 dark:text-[#9ca3af] hover:text-gray-700 dark:hover:text-white'
          }`}
        >
          {S.dateRange[key]}
        </button>
      ))}
    </div>
  )
}
