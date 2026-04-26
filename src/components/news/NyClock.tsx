import { useEffect, useState } from 'react'

function formatNy(d: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour:     '2-digit',
    minute:   '2-digit',
    second:   '2-digit',
    hour12:   false,
  }).format(d)
}

export function NyClock() {
  const [time, setTime] = useState(() => formatNy(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatNy(new Date())), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-[#9ca3af]"
      title="New York time"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 [animation:qt-pulse_2s_ease-in-out_infinite]" aria-hidden />
      <span className="font-mono">{time}</span>
      <span className="text-[9px] uppercase tracking-wider opacity-60">NY</span>
    </span>
  )
}
