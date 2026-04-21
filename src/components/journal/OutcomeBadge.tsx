import { OUTCOME_COLORS } from '@/lib/constants/colors'
import type { Outcome } from '@/types'

interface Props {
  outcome: Outcome | null
}

const LABELS: Record<Outcome, string> = {
  win:       'WIN',
  loss:      'LOSS',
  breakeven: 'BE',
}

export function OutcomeBadge({ outcome }: Props) {
  if (!outcome) return <span className="text-[#9ca3af]">—</span>
  const color = OUTCOME_COLORS[outcome]
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {LABELS[outcome]}
    </span>
  )
}
