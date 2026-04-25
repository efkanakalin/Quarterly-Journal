import { useEffect, useState } from 'react'
import { fmtCountdown } from '@/lib/news/format'

interface Props {
  targetIso: string | null
  label: string
}

export function CountdownBadge({ targetIso, label }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!targetIso) return null
  const diff = new Date(targetIso).getTime() - now
  if (!Number.isFinite(diff) || diff < 0) return null

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/40 bg-rose-500/10 px-3 py-1 text-[11px] font-medium text-rose-700 dark:border-rose-400/30 dark:text-rose-300"
      aria-label={`${label} in ${fmtCountdown(targetIso, now)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 [animation:qt-pulse_2s_ease-out_infinite] motion-reduce:animate-none" />
      <span className="truncate max-w-[16ch]">{label}</span>
      <span className="font-mono">in {fmtCountdown(targetIso, now)}</span>
    </span>
  )
}
