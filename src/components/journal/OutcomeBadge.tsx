import type { Outcome } from '@/types'

interface Props { outcome: Outcome | null }

// WIN / STOP / B/E — kasıtlı olarak i18n dışında, iki dilde de sabit
const LABELS: Record<Outcome, string> = {
  win:       'WIN',
  loss:      'STOP',
  breakeven: 'B/E',
}

// Düz tipografi rengi — arka plan yok
const TEXT: Record<Outcome, string> = {
  win:       'text-emerald-600 dark:text-emerald-400',
  loss:      'text-rose-600 dark:text-rose-400',
  breakeven: 'text-amber-600 dark:text-amber-400',
}

export function OutcomeBadge({ outcome }: Props) {
  if (!outcome) return <span className="text-gray-400 dark:text-[#9ca3af]">—</span>
  return (
    <span className={`text-xs font-bold tracking-wide ${TEXT[outcome]}`}>
      {LABELS[outcome]}
    </span>
  )
}
