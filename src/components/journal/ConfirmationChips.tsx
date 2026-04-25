import { CONFIRMATION_PALETTE, BADGE_CLASS } from '@/lib/constants/palette'
import { sortByTimeframe } from '@/lib/constants/timeframes'
import type { TradeConfirmation } from '@/types'

interface Props {
  confirmations: TradeConfirmation[]
}

export function ConfirmationChips({ confirmations }: Props) {
  if (!confirmations?.length) return <span className="text-gray-400 dark:text-[#9ca3af]">—</span>

  const sorted = sortByTimeframe(confirmations)

  return (
    <div className="flex flex-wrap justify-center gap-1">
      {sorted.map((c) => {
        const cls = BADGE_CLASS[CONFIRMATION_PALETTE[c.confirmation_type] ?? 'slate']
        return (
          <span
            key={c.id}
            className={`inline-flex items-center rounded-sm px-2 py-1 text-xs font-medium whitespace-nowrap ${cls}`}
          >
            {c.timeframe} {c.confirmation_type}
          </span>
        )
      })}
    </div>
  )
}
