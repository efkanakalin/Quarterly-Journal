import type { Direction } from '@/types'

export function deriveDirection(boughtTimestamp: string, soldTimestamp: string): Direction {
  const bought = new Date(boughtTimestamp).getTime()
  const sold   = new Date(soldTimestamp).getTime()
  return bought < sold ? 'long' : 'short'
}
