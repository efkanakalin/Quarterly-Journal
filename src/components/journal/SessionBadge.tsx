import { SESSION_LABELS } from '@/lib/constants/colors'
import type { Session } from '@/types'

interface Props {
  session: Session | null
}

export function SessionBadge({ session }: Props) {
  if (!session) return <span className="text-gray-400 dark:text-[#9ca3af]">—</span>
  return (
    <span className="text-sm font-medium text-gray-700 dark:text-[#d1d5db]">
      {SESSION_LABELS[session]}
    </span>
  )
}
