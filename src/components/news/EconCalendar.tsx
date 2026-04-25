import { useEffect, useMemo, useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNewsStore } from '@/stores/useNewsStore'
import { CalendarRow } from './CalendarRow'
import { CountdownBadge } from './CountdownBadge'
import { useS } from '@/lib/i18n'

function ymd(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function EconCalendar() {
  const events     = useNewsStore(s => s.events)
  const showLow    = useNewsStore(s => s.showLowImpact)
  const setShowLow = useNewsStore(s => s.setShowLowImpact)
  const S = useS()

  const today = useMemo(() => new Date(), [])
  const [day, setDay] = useState<Date>(today)

  // Days with any event (respecting impact filter)
  const availableDays = useMemo(() => {
    const visible = events.filter(e => showLow || e.impact === 'high' || e.impact === 'medium')
    const set = new Set<string>()
    for (const e of visible) {
      if (!e.time) continue
      set.add(ymd(new Date(e.time)))
    }
    return Array.from(set).sort()
  }, [events, showLow])

  // If current day has no events once data arrives, snap to today (or nearest future day)
  useEffect(() => {
    if (!availableDays.length) return
    const current = ymd(day)
    if (availableDays.includes(current)) return
    const todayStr = ymd(today)
    if (availableDays.includes(todayStr)) setDay(today)
    else {
      const future = availableDays.find(d => d >= todayStr)
      setDay(new Date(future ?? availableDays[0]))
    }
  }, [availableDays, day, today])

  const dayEvents = useMemo(() => {
    const key = ymd(day)
    return events
      .filter(e => e.time && ymd(new Date(e.time)) === key)
      .filter(e => showLow || e.impact === 'high' || e.impact === 'medium')
  }, [events, day, showLow])

  const nextHigh = useMemo(() => {
    const now = Date.now()
    return events.find(e =>
      e.impact === 'high' && e.time && new Date(e.time).getTime() > now,
    ) ?? null
  }, [events])

  const currentKey = ymd(day)
  const currentIdx = availableDays.indexOf(currentKey)
  const canPrev = currentIdx > 0
  const canNext = currentIdx >= 0 && currentIdx < availableDays.length - 1
  const goPrev = () => { if (canPrev) setDay(new Date(availableDays[currentIdx - 1])) }
  const goNext = () => { if (canNext) setDay(new Date(availableDays[currentIdx + 1])) }
  const isToday = isSameDay(day, today)

  return (
    <section className="flex flex-col rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1a1a1a]">
      <header className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
            {S.news.calendar}
          </h2>
          {nextHigh && (
            <CountdownBadge
              targetIso={nextHigh.time}
              label={`${nextHigh.currency} ${nextHigh.title}`}
            />
          )}
        </div>

        {/* Day navigator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              disabled={!canPrev}
              aria-label="Previous day"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-[#9ca3af] dark:hover:bg-white/5 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="min-w-[140px] text-center">
              {isToday ? (
                <span className="inline-flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#415dff] dark:text-[#8a9eff]">
                    {S.news.today}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-[#9ca3af]">
                    {format(day, 'EEE, MMM d')}
                  </span>
                </span>
              ) : (
                <span className="text-xs font-medium text-gray-700 dark:text-[#d1d5db]">
                  {format(day, 'EEE, MMM d')}
                </span>
              )}
            </div>
            <button
              onClick={goNext}
              disabled={!canNext}
              aria-label="Next day"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:hover:bg-transparent dark:text-[#9ca3af] dark:hover:bg-white/5 dark:hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {!isToday && (
              <button
                onClick={() => setDay(today)}
                className="ml-2 rounded-full border border-gray-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 transition-colors hover:border-[#415dff] hover:text-[#415dff] dark:border-white/10 dark:text-[#9ca3af] dark:hover:border-[#415dff] dark:hover:text-[#8a9eff]"
              >
                {S.news.today}
              </button>
            )}
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-gray-500 dark:text-[#9ca3af]">
            <input
              type="checkbox"
              checked={showLow}
              onChange={e => setShowLow(e.target.checked)}
              className="h-3 w-3 accent-[#415dff]"
            />
            {S.news.showLow}
          </label>
        </div>
      </header>

      {dayEvents.length === 0 ? (
        <div className="p-10 text-center">
          <p className="text-sm text-gray-400 dark:text-[#6b7280]">
            {isToday ? S.news.nothingToday : S.news.noEvents}
          </p>
        </div>
      ) : (
        <div className="max-h-[520px] overflow-y-auto scrollbar-light dark:scrollbar-dark">
          <ul className="divide-y divide-gray-100 dark:divide-white/5">
            {dayEvents.map(e => <CalendarRow key={e.id} event={e} />)}
          </ul>
        </div>
      )}
    </section>
  )
}
