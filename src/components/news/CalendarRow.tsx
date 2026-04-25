import type { CalendarEvent } from '@/types/news'
import { fmtClock, flag } from '@/lib/news/format'

interface Props { event: CalendarEvent }

const IMPACT_DOT: Record<CalendarEvent['impact'], string> = {
  high:    'bg-rose-500',
  medium:  'bg-amber-400',
  low:     'bg-yellow-300/60',
  holiday: 'bg-gray-300 dark:bg-white/20',
}

export function CalendarRow({ event }: Props) {
  const dim = event.impact === 'low' || event.impact === 'holiday'
  return (
    <li
      className={`grid grid-cols-[54px_24px_1fr_auto] items-center gap-3 px-5 py-2.5 ${
        dim ? 'opacity-60' : ''
      }`}
    >
      <time className="font-mono text-[11px] text-gray-500 dark:text-[#9ca3af]">
        {fmtClock(event.time)}
      </time>
      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-[#9ca3af]">
        <span className={`h-2 w-2 rounded-full ${IMPACT_DOT[event.impact]}`} aria-hidden />
        {flag(event.currency)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-gray-900 dark:text-white">{event.title}</p>
        <p className="text-[10px] text-gray-400 dark:text-[#6b7280]">
          {event.currency}
        </p>
      </div>
      <div className="flex items-center gap-4 text-right text-[11px] tabular-nums text-gray-500 dark:text-[#9ca3af]">
        <span><span className="mr-1 text-gray-400 dark:text-[#6b7280]">F</span>{event.forecast ?? '—'}</span>
        <span><span className="mr-1 text-gray-400 dark:text-[#6b7280]">P</span>{event.previous ?? '—'}</span>
      </div>
    </li>
  )
}
