import type { ConfirmationType } from '@/types'

export const CONFIRMATION_TYPES: ConfirmationType[] = [
  'SSMT', 'PSP', 'PRC', 'SD', 'SMTF', 'PG',
  'O/C', 'DFR', 'FVG', 'PO3', 'MMXM', 'CVD',
  'LIQ SWEEP', 'ISSMT', 'HSSMT',
]

export const CONFIRMATION_COLORS: Record<ConfirmationType, string> = {
  'SSMT':      '#f59e0b',
  'PSP':       '#3b82f6',
  'PRC':       '#8b5cf6',
  'SD':        '#10b981',
  'SMTF':      '#f97316',
  'PG':        '#06b6d4',
  'O/C':       '#ec4899',
  'DFR':       '#84cc16',
  'FVG':       '#a855f7',
  'PO3':       '#14b8a6',
  'MMXM':      '#ef4444',
  'CVD':       '#f43f5e',
  'LIQ SWEEP': '#64748b',
  'ISSMT':     '#d97706',
  'HSSMT':     '#0ea5e9',
}
