import { getWeek, getMonth, getQuarter } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const ET_TZ = 'America/New_York'

export function deriveWeekOfYear(utcDate: Date): number {
  const et = toZonedTime(utcDate, ET_TZ)
  return getWeek(et)
}

export function deriveMonthQuarter(utcDate: Date): string {
  const et = toZonedTime(utcDate, ET_TZ)
  const day = et.getDate()
  // Month split into 4 quarters: 1-7, 8-14, 15-21, 22+
  const q = Math.min(Math.ceil(day / 7), 4)
  return `Q${q}`
}

export function deriveYearQuarter(utcDate: Date): string {
  const et = toZonedTime(utcDate, ET_TZ)
  const month = getMonth(et) // 0-indexed
  const q = Math.floor(month / 3) + 1
  return `Q${q}`
}

export function deriveDayOfWeek(utcDate: Date): number {
  const et = toZonedTime(utcDate, ET_TZ)
  return et.getDay() // 0 = Sunday
}

export { getQuarter }
