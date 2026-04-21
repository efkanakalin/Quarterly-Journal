import { OUTCOME_COLORS } from '@/lib/constants/colors'
import { useS } from '@/lib/i18n'
import type { Outcome } from '@/types'

interface Props { outcome: Outcome | null }

export function OutcomeBadge({ outcome }: Props) {
  const S = useS()
  if (!outcome) return <span className="text-gray-400 dark:text-[#9ca3af]">—</span>
  const color = OUTCOME_COLORS[outcome]
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold" style={{ backgroundColor: `${color}22`, color }}>
      {S.outcome[outcome]}
    </span>
  )
}
