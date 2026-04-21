import { formatInTimeZone } from 'date-fns-tz'

const ET_TZ = 'America/New_York'

/** Tarihi New York (ET) saatine göre formatlar */
export function formatET(date: Date | string, fmt: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatInTimeZone(d, ET_TZ, fmt)
}
