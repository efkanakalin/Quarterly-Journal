import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useDashboardStore, type DateRangeKey } from '@/stores/useDashboardStore'
import { useS } from '@/lib/i18n'

const KEYS: DateRangeKey[] = ['today', 'this_week', 'this_month', 'last_30', 'last_90', 'all']

export function DateRangePicker() {
  const { dateRange, setDateRange } = useDashboardStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const S = useS()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-3 py-2 text-xs font-medium text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors min-w-[140px] justify-between"
      >
        <span>{S.dateRange[dateRange]}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 min-w-[160px] rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-lg py-1">
          {KEYS.map(key => {
            const active = dateRange === key
            return (
              <button
                key={key}
                onClick={() => { setDateRange(key); setOpen(false) }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{S.dateRange[key]}</span>
                {active && <Check className="h-3.5 w-3.5" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
