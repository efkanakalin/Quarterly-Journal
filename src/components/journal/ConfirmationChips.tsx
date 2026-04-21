import { CONFIRMATION_COLORS } from '@/lib/constants/confirmations'
import type { TradeConfirmation } from '@/types'

interface Props {
  confirmations: TradeConfirmation[]
}

export function ConfirmationChips({ confirmations }: Props) {
  if (!confirmations?.length) return <span className="text-[#9ca3af]">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {confirmations.map((c) => {
        const color = CONFIRMATION_COLORS[c.confirmation_type] ?? '#9ca3af'
        return (
          <span
            key={c.id}
            className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {c.timeframe} {c.confirmation_type}
          </span>
        )
      })}
    </div>
  )
}
