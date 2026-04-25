import { useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { NewsItem } from './NewsItem'
import { LiveDot } from './LiveDot'
import { useNewsStore } from '@/stores/useNewsStore'
import { useS } from '@/lib/i18n'

export function NewsFeed() {
  const items         = useNewsStore(s => s.items)
  const markAllSeen   = useNewsStore(s => s.markAllSeen)
  const seenIds       = useNewsStore(s => s.seenIds)
  const error         = useNewsStore(s => s.error)
  const S = useS()

  const filtered = items

  const parentRef = useRef<HTMLDivElement>(null)
  const virt = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 84,
    overscan: 10,
  })

  // Mark all as seen when the user scrolls/opens
  const [initialMark, setInitialMark] = useState(false)
  useEffect(() => {
    if (!initialMark && filtered.length) {
      const t = setTimeout(() => { markAllSeen(); setInitialMark(true) }, 800)
      return () => clearTimeout(t)
    }
  }, [filtered.length, initialMark, markAllSeen])

  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#1a1a1a]">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">
            {S.news.liveFeed}
          </h2>
          <LiveDot />
        </div>
        <span className="text-[11px] font-medium text-gray-400 dark:text-[#6b7280]">
          {filtered.length} {S.news.headlines}
        </span>
      </header>

      <div ref={parentRef} className="relative flex-1 overflow-y-auto scrollbar-light dark:scrollbar-dark">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center p-10 text-center">
            <p className="text-sm text-gray-400 dark:text-[#6b7280]">
              {error ? S.news.error : S.news.waiting}
            </p>
          </div>
        ) : (
          <div
            style={{ height: virt.getTotalSize(), position: 'relative', width: '100%' }}
          >
            {virt.getVirtualItems().map(v => {
              const it = filtered[v.index]
              return (
                <div
                  key={it.id}
                  data-index={v.index}
                  ref={virt.measureElement}
                  style={{
                    position:  'absolute',
                    top:       0,
                    left:      0,
                    width:     '100%',
                    transform: `translateY(${v.start}px)`,
                  }}
                >
                  <NewsItem item={it} highlight={!seenIds[it.id]} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
