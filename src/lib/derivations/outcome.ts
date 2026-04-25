import type { Outcome } from '@/types'

// Outcome eşikleri:
// - PnL > +5$ → WIN
// - PnL < -5$ → STOP (loss)
// - -5$ ≤ PnL ≤ +5$ → B/E (breakeven)
const BREAKEVEN_THRESHOLD = 5

export function deriveOutcome(pnl: number): Outcome {
  if (pnl >  BREAKEVEN_THRESHOLD) return 'win'
  if (pnl < -BREAKEVEN_THRESHOLD) return 'loss'
  return 'breakeven'
}
