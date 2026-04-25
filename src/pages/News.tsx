import { useEffect } from 'react'
import { useNewsStore } from '@/stores/useNewsStore'
import { NewsFeed } from '@/components/news/NewsFeed'
import { EconReleases } from '@/components/news/EconReleases'
import { EconCalendar } from '@/components/news/EconCalendar'
import { AlarmSettings } from '@/components/news/AlarmSettings'
import { useS } from '@/lib/i18n'

export function News() {
  const start = useNewsStore(s => s.start)
  const S = useS()

  useEffect(() => {
    const stop = start()
    return stop
  }, [start])

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <header className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {S.nav.news}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-[#9ca3af]">
            {S.news.subtitle}
          </p>
        </div>
        <AlarmSettings />
      </header>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Zone A */}
        <div className="min-h-[480px] sm:min-h-[620px] lg:h-[calc(100vh-9rem)]">
          <NewsFeed />
        </div>

        {/* Right column: Calendar on top, Data below */}
        <div className="flex flex-col gap-4 sm:gap-6">
          <EconCalendar />
          <EconReleases />
        </div>
      </div>
    </div>
  )
}
