import { useDashboardStore, DATE_RANGE_LABELS, type DateRangeKey } from '@/stores/useDashboardStore'

const KEYS = Object.keys(DATE_RANGE_LABELS) as DateRangeKey[]

export function DateRangePicker() {
  const { dateRange, setDateRange } = useDashboardStore()

  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#1a1a1a] p-1">
      {KEYS.map(key => (
        <button
          key={key}
          onClick={() => setDateRange(key)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            dateRange === key
              ? 'bg-blue-500 text-white'
              : 'text-[#9ca3af] hover:text-white'
          }`}
        >
          {DATE_RANGE_LABELS[key]}
        </button>
      ))}
    </div>
  )
}
