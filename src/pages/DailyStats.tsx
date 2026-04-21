import { TrendingUp } from 'lucide-react'
import { useS } from '@/lib/i18n'

export function DailyStats() {
  const S = useS()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-500/10">
        <TrendingUp className="h-8 w-8 text-blue-500" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{S.nav.dailyStats}</h1>
      <p className="text-gray-500 dark:text-[#9ca3af] max-w-sm">{S.placeholder.comingSoon}</p>
      <p className="text-sm text-gray-400 dark:text-[#6b7280] max-w-sm">{S.placeholder.comingSoonHint}</p>
    </div>
  )
}
