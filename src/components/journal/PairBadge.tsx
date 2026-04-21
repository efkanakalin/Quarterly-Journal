import { SYMBOL_COLORS } from '@/lib/constants/colors'

interface Props {
  symbol: string | null
}

export function PairBadge({ symbol }: Props) {
  if (!symbol) return <span className="text-[#9ca3af]">—</span>
  const color = SYMBOL_COLORS[symbol] ?? '#9ca3af'
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {symbol}
    </span>
  )
}
