import { SESSION_COLORS, SESSION_LABELS } from '@/lib/constants/colors'
import type { Session } from '@/types'

interface Props {
  session: Session | null
}

export function SessionBadge({ session }: Props) {
  if (!session) return <span className="text-[#9ca3af]">—</span>
  const color = SESSION_COLORS[session]
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {SESSION_LABELS[session]}
    </span>
  )
}
