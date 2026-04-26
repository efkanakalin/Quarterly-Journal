import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CalendarEvent, EconRelease, NewsItem } from '@/types/news'
import { fetchCalendar, fetchEconReleases, fetchNews } from '@/lib/api/news'
import { playAlarm, sendDesktop, useAlarmStore } from './useAlarmStore'

const NEWS_POLL_MS    = 30_000
const ECON_POLL_MS    = 60_000
const CALENDAR_POLL_MS = 15 * 60_000

interface NewsState {
  items:     NewsItem[]
  releases:  EconRelease[]
  events:    CalendarEvent[]

  seenIds: Record<string, true>
  unread:  number
  markAllSeen: () => void

  /** IDs that just arrived in the latest poll — drive the red-flash animation. */
  flashIds: Record<string, true>

  showLowImpact: boolean
  setShowLowImpact: (v: boolean) => void

  showLowEconImpact: boolean
  setShowLowEconImpact: (v: boolean) => void

  notifiedEventIds: Record<string, true>

  error: string | null

  hasStarted: boolean
  start: () => () => void
}

const SEEN_LIMIT = 2000

export const useNewsStore = create<NewsState>()(
  persist(
    (set, get) => ({
      items:    [],
      releases: [],
      events:   [],

      seenIds: {},
      unread:  0,
      flashIds: {},
      markAllSeen: () => {
        const { items, seenIds } = get()
        const next = { ...seenIds }
        for (const it of items) next[it.id] = true
        // Trim seen map
        const keys = Object.keys(next)
        if (keys.length > SEEN_LIMIT) {
          const drop = keys.slice(0, keys.length - SEEN_LIMIT)
          for (const k of drop) delete next[k]
        }
        set({ seenIds: next, unread: 0 })
      },

      showLowImpact: false,
      setShowLowImpact: (v) => set({ showLowImpact: v }),

      showLowEconImpact: false,
      setShowLowEconImpact: (v) => set({ showLowEconImpact: v }),

      notifiedEventIds: {},

      error: null,

      hasStarted: false,
      start: () => {
        if (get().hasStarted) return () => {}
        // Always start with a clean feed — persisted cache from older sessions
        // can leave a stale headline at the top until the next tick arrives.
        set({ hasStarted: true, items: [] })

        const tickNews = async () => {
          try {
            const fresh = await fetchNews()
            const prev = get().items
            const prevIds = new Set(prev.map(p => p.id))
            const newOnes = fresh.filter(i => !prevIds.has(i.id))

            // Merge, guarantee newest-first, cap 50.
            const merged = [...newOnes, ...prev]
              .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
              .slice(0, 50)

            // Unread = any item not yet marked seen
            const { seenIds, flashIds } = get()
            const unread = merged.filter(i => !seenIds[i.id]).length

            // Add new arrivals to flashIds (skip on very first load to avoid flashing all 50)
            const isFirstLoad = prev.length === 0
            const nextFlash = { ...flashIds }
            if (!isFirstLoad) {
              for (const n of newOnes) nextFlash[n.id] = true
              // Auto-clear each flash after the animation finishes
              for (const n of newOnes) {
                setTimeout(() => {
                  set(s => {
                    const { [n.id]: _, ...rest } = s.flashIds
                    return { flashIds: rest }
                  })
                }, 4000)
              }
            }

            set({ items: merged, unread, flashIds: nextFlash, error: null })
          } catch (e) {
            set({ error: String(e) })
          }
        }

        const tickEcon = async () => {
          try { set({ releases: await fetchEconReleases() }) }
          catch (e) { set({ error: String(e) }) }
        }

        const tickCal = async () => {
          try { set({ events: await fetchCalendar(['high', 'medium', 'low']) }) }
          catch (e) { set({ error: String(e) }) }
        }

        // Deadline watcher (every 15s): notify at T-N for next high-impact
        const tickDeadlines = () => {
          const { events, notifiedEventIds } = get()
          const alarm = useAlarmStore.getState()
          const now = Date.now()
          const windowEnd = now + alarm.notifyHighImpactMinutes * 60_000
          const upcoming = events.filter(e =>
            e.impact === 'high' && e.time &&
            new Date(e.time).getTime() > now &&
            new Date(e.time).getTime() <= windowEnd &&
            !notifiedEventIds[e.id],
          )
          if (!upcoming.length) return
          const next = { ...notifiedEventIds }
          for (const e of upcoming) next[e.id] = true
          set({ notifiedEventIds: next })
          const first = upcoming[0]
          if (alarm.soundEnabled) playAlarm(alarm.sound, alarm.volume)
          if (alarm.desktopEnabled) {
            sendDesktop(`${first.currency} · High impact`, first.title)
          }
        }

        tickNews(); tickEcon(); tickCal()
        const n = setInterval(tickNews, NEWS_POLL_MS)
        const e = setInterval(tickEcon, ECON_POLL_MS)
        const c = setInterval(tickCal,  CALENDAR_POLL_MS)
        const d = setInterval(tickDeadlines, 15_000)
        return () => {
          clearInterval(n); clearInterval(e); clearInterval(c); clearInterval(d)
          set({ hasStarted: false })
        }
      },
    }),
    {
      name: 'qt-news',
      partialize: (s) => ({
        seenIds:           s.seenIds,
        showLowImpact:     s.showLowImpact,
        showLowEconImpact: s.showLowEconImpact,
        notifiedEventIds:  s.notifiedEventIds,
      }),
    },
  ),
)
