import { create } from 'zustand'
import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  subDays,
} from 'date-fns'

export type DateRangeKey = 'today' | 'this_week' | 'this_month' | 'last_30' | 'last_90' | 'all'

export const DATE_RANGE_LABELS: Record<DateRangeKey, string> = {
  today:      'Bugün',
  this_week:  'Bu Hafta',
  this_month: 'Bu Ay',
  last_30:    'Son 30 Gün',
  last_90:    'Son 90 Gün',
  all:        'Tümü',
}
// Backwards compat — strings.ts canonical source

export function getDateBounds(key: DateRangeKey): { start: Date; end: Date } | null {
  const now = new Date()
  switch (key) {
    case 'today':      return { start: startOfDay(now), end: endOfDay(now) }
    case 'this_week':  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'this_month': return { start: startOfMonth(now), end: endOfMonth(now) }
    case 'last_30':    return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) }
    case 'last_90':    return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) }
    case 'all':        return null
  }
}

interface DashboardState {
  dateRange: DateRangeKey
  setDateRange: (range: DateRangeKey) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dateRange: 'all',
  setDateRange: (range) => set({ dateRange: range }),
}))
