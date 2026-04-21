export const QT_SCORE_CONFIG = {
  confirmationDensity: {
    multiplier: 20,   // avg confirmations per trade * 20 → score
    max: 100,
  },
  sessionDiscipline: {
    primarySessions: ['ny_am', 'ny_pm'] as string[],  // counted as "disciplined"
  },
  executionCleanliness: {
    // (1 - mistake_rate) * 100
  },
  rEfficiency: {
    multiplier: 33.33,  // 3R = 100 pts
    max: 100,
  },
}
