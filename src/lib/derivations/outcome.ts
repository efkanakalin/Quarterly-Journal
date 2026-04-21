import type { ContractClass, Outcome } from '@/types'

export function deriveOutcome(pnl: number, contractClass: ContractClass): Outcome {
  const threshold = contractClass === 'micro' ? 1 : 2

  if (pnl > threshold)   return 'win'
  if (pnl < -threshold)  return 'loss'
  return 'breakeven'
}
