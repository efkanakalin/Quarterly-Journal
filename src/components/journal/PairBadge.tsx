interface Props {
  symbol: string | null
}

export function PairBadge({ symbol }: Props) {
  if (!symbol) return <span className="text-gray-400 dark:text-[#9ca3af]">—</span>
  return (
    <span className="text-sm text-gray-900 dark:text-white">
      {symbol}
    </span>
  )
}
