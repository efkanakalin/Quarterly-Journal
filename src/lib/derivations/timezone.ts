import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const SOURCE_TZ = 'Europe/Istanbul'
const TARGET_TZ = 'America/New_York'

/**
 * Converts a timestamp string from Istanbul time to New York time.
 * Returns an ISO string with the ET offset.
 *
 * IMPORTANT: Never use fixed offsets. DST is handled automatically by date-fns-tz.
 */
export function convertTrToEt(trTimestamp: string): Date {
  // Parse the timestamp as Istanbul local time
  const trDate = fromZonedTime(trTimestamp, SOURCE_TZ)
  // Convert to New York time zone
  return toZonedTime(trDate, TARGET_TZ)
}

export function toEtIsoString(trTimestamp: string): string {
  const etDate = convertTrToEt(trTimestamp)
  return etDate.toISOString()
}
