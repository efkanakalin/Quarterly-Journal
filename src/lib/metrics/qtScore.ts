import { QT_SCORE_CONFIG as CFG } from './qtScoreConfig'
import type { TradeWithRelations } from '@/types'

export interface QTScoreResult {
  total: number          // 0–100
  confirmationDensity: number
  sessionDiscipline: number
  executionCleanliness: number
  rEfficiency: number
}

/**
 * Placeholder formül — Efkan'ın gerçek formülü gelince SADECE bu fonksiyon değişir.
 * Config sabitleri qtScoreConfig.ts içinde.
 */
export function calculateQTScore(trades: TradeWithRelations[]): QTScoreResult {
  if (trades.length === 0) {
    return { total: 0, confirmationDensity: 0, sessionDiscipline: 0, executionCleanliness: 0, rEfficiency: 0 }
  }

  // 1. Konfirmasyon Yoğunluğu
  const totalConfs = trades.reduce((s, t) => s + (t.trade_confirmations?.length ?? 0), 0)
  const avgConfs = totalConfs / trades.length
  const confirmationDensity = Math.min(CFG.confirmationDensity.max, avgConfs * CFG.confirmationDensity.multiplier)

  // 2. Session Disiplini — NY AM + NY PM ağırlıklı işlemler
  const primaryCount = trades.filter(t => t.session && CFG.sessionDiscipline.primarySessions.includes(t.session)).length
  const sessionDiscipline = (primaryCount / trades.length) * 100

  // 3. Execution Temizliği — hata olan işlem oranının tersi
  const mistakeTrades = trades.filter(t => t.trade_mistakes && t.trade_mistakes.length > 0).length
  const executionCleanliness = (1 - mistakeTrades / trades.length) * 100

  // 4. R Verimi — ortalama R multiple
  const rTrades = trades.filter(t => t.r_multiple !== null)
  const avgR = rTrades.length === 0 ? 0 : rTrades.reduce((s, t) => s + (t.r_multiple ?? 0), 0) / rTrades.length
  const rEfficiency = Math.min(CFG.rEfficiency.max, Math.max(0, avgR * CFG.rEfficiency.multiplier))

  const total = (confirmationDensity + sessionDiscipline + executionCleanliness + rEfficiency) / 4

  return {
    total: Math.round(total),
    confirmationDensity: Math.round(confirmationDensity),
    sessionDiscipline:   Math.round(sessionDiscipline),
    executionCleanliness: Math.round(executionCleanliness),
    rEfficiency:         Math.round(rEfficiency),
  }
}
