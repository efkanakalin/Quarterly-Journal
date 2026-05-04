import { CONFIRMATION_PALETTE, BADGE_CLASS } from '@/lib/constants/palette'
import { sortByTimeframe } from '@/lib/constants/timeframes'
import type { TradeConfirmation } from '@/types'

interface Props {
  confirmations: TradeConfirmation[]
  size?: 'sm' | 'md'
}

export function ConfirmationChips({ confirmations, size = 'sm' }: Props) {
  if (!confirmations?.length) return <span className="text-gray-400 dark:text-[#9ca3af]">—</span>

  const sorted = sortByTimeframe(confirmations)
  const chipCls = size === 'md'
    ? 'px-2.5 py-1.5 text-sm gap-1.5'
    : 'px-2 py-1 text-xs'
  const wrapGap = size === 'md' ? 'gap-1.5' : 'gap-1'

  return (
    <div className={`flex flex-wrap justify-center ${wrapGap}`}>
      {sorted.map((c) => {
        const cls = BADGE_CLASS[CONFIRMATION_PALETTE[c.confirmation_type] ?? 'slate']
        return (
          <span
            key={c.id}
            className={`inline-flex items-center rounded-sm font-medium whitespace-nowrap ${chipCls} ${cls}`}
          >
            {c.timeframe ? `${c.timeframe} ` : ''}{c.confirmation_type}
          </span>
        )
      })}
    </div>
  )
}
