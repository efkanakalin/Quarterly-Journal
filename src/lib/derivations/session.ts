import { toZonedTime } from 'date-fns-tz'
import type { Session, SessionQuarter } from '@/types'

const ET_TZ = 'America/New_York'

// Session boundaries in ET (hour, minute)
const SESSION_BOUNDS = [
  { session: 'asia'   as Session, start: 18, end: 24 },
  { session: 'london' as Session, start: 0,  end: 6  },
  { session: 'ny_am'  as Session, start: 6,  end: 12 },
  { session: 'ny_pm'  as Session, start: 12, end: 18 },
]

export function deriveSession(utcDate: Date): Session {
  const et = toZonedTime(utcDate, ET_TZ)
  const hour = et.getHours()

  for (const bounds of SESSION_BOUNDS) {
    if (hour >= bounds.start && hour < bounds.end) {
      return bounds.session
    }
  }
  // Asia spans across midnight: 18:00 – 00:00
  // hour >= 18 is caught by the first entry (start:18, end:24)
  // If somehow not matched, default to asia
  return 'asia'
}

export function deriveSessionQuarter(utcDate: Date, session: Session): SessionQuarter {
  const et = toZonedTime(utcDate, ET_TZ)
  const hour    = et.getHours()
  const minutes = et.getMinutes()
  const totalMinutes = hour * 60 + minutes

  const sessionStart: Record<Session, number> = {
    asia:   18 * 60,
    london: 0 * 60,
    ny_am:  6 * 60,
    ny_pm:  12 * 60,
  }

  const start = sessionStart[session]
  // Each session is 6 hours = 360 minutes, quarter = 90 minutes
  let elapsed = totalMinutes - start
  if (elapsed < 0) elapsed += 24 * 60 // handle midnight wrap for asia

  const quarterIndex = Math.floor(elapsed / 90)
  const quarters: SessionQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']
  return quarters[Math.min(quarterIndex, 3)]
}

export function deriveMicroQuarter90m(utcDate: Date, session: Session): SessionQuarter {
  const et = toZonedTime(utcDate, ET_TZ)
  const hour    = et.getHours()
  const minutes = et.getMinutes()
  const totalMinutes = hour * 60 + minutes

  const sessionStart: Record<Session, number> = {
    asia:   18 * 60,
    london: 0 * 60,
    ny_am:  6 * 60,
    ny_pm:  12 * 60,
  }

  const start = sessionStart[session]
  let elapsed = totalMinutes - start
  if (elapsed < 0) elapsed += 24 * 60

  // Find which 90-min block we're in
  const blockIndex = Math.floor(elapsed / 90)
  // Within that block, find the micro quarter (22.5 min each)
  const withinBlock = elapsed - blockIndex * 90
  const microIndex  = Math.floor(withinBlock / 22.5)

  const quarters: SessionQuarter[] = ['Q1', 'Q2', 'Q3', 'Q4']
  return quarters[Math.min(microIndex, 3)]
}
