import { useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  CONFIRMATIONS,
  CONFIRMATION_NEEDS_TIMEFRAME,
} from '@/lib/constants/confirmations'
import { CONFIRMATION_PALETTE, BADGE_CLASS } from '@/lib/constants/palette'
import { sortByTimeframe } from '@/lib/constants/timeframes'
import { useUserPrefsStore } from '@/stores/useUserPrefsStore'
import { useS } from '@/lib/i18n'
import type { ConfirmationType, Timeframe, TradeConfirmation } from '@/types'

interface Props {
  confirmations: TradeConfirmation[]
  onChange: (confirmations: TradeConfirmation[]) => void
}

const NO_TF_VALUE = '__NONE__'

export function WizardStep1Confirmations({ confirmations, onChange }: Props) {
  const enabledTimeframes    = useUserPrefsStore(s => s.enabledTimeframes)
  const enabledConfirmations = useUserPrefsStore(s => s.enabledConfirmations)
  const customConfirmations  = useUserPrefsStore(s => s.customConfirmations)
  const S = useS()

  // Active confluences (built-in + custom)
  const availableConfs = useMemo(() => {
    const builtIn = CONFIRMATIONS.filter(c => enabledConfirmations.includes(c.type))
    const customAsConfs = customConfirmations
      .filter(label => enabledConfirmations.includes(label as ConfirmationType))
      .map(label => ({
        type: label as ConfirmationType,
        group: 'CUSTOM' as const,
        needsTimeframe: true,
      }))
    return [...builtIn, ...customAsConfs]
  }, [enabledConfirmations, customConfirmations])

  const [selectedType, setSelectedType] = useState<ConfirmationType>(
    () => availableConfs[0]?.type ?? 'SSMT',
  )

  // Default TF: first enabled, fallback to '15M'
  const [selectedTf, setSelectedTf] = useState<Timeframe | null>(
    () => enabledTimeframes[0] ?? '15M',
  )

  // If selected confluence becomes unavailable, snap to first available
  useEffect(() => {
    if (!availableConfs.find(c => c.type === selectedType)) {
      setSelectedType(availableConfs[0]?.type ?? 'SSMT')
    }
  }, [availableConfs, selectedType])

  // If selected confluence doesn't need TF, force TF to null
  useEffect(() => {
    if (CONFIRMATION_NEEDS_TIMEFRAME[selectedType] === false) {
      setSelectedTf(null)
    }
  }, [selectedType])

  const needsTf = CONFIRMATION_NEEDS_TIMEFRAME[selectedType] !== false

  const add = () => {
    if (
      confirmations.some(
        c => c.timeframe === selectedTf && c.confirmation_type === selectedType,
      )
    ) return
    onChange([
      ...confirmations,
      {
        id:                `tmp-${Date.now()}`,
        trade_id:          '',
        timeframe:         selectedTf,
        confirmation_type: selectedType,
        created_at:        new Date().toISOString(),
      },
    ])
  }
  const remove = (id: string) => onChange(confirmations.filter(c => c.id !== id))

  const SEL =
    'rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {S.wizard.confirmationsTitle}
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-[#9ca3af]">
          {S.wizard.confirmationsHint}
        </p>
      </div>

      {availableConfs.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">
          {S.customization.pickerEmpty}
        </p>
      ) : (
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={selectedTf ?? NO_TF_VALUE}
            onChange={e => {
              const v = e.target.value
              setSelectedTf(v === NO_TF_VALUE ? null : (v as Timeframe))
            }}
            disabled={!needsTf}
            className={SEL + (needsTf ? '' : ' opacity-40 cursor-not-allowed')}
          >
            <option value={NO_TF_VALUE}>—</option>
            {enabledTimeframes.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as ConfirmationType)}
            className={SEL + ' flex-1 min-w-0'}
          >
            {availableConfs.map(c => (
              <option key={c.type} value={c.type}>
                {c.type}{c.needsTimeframe ? '' : ' (no TF)'}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      )}

      {confirmations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sortByTimeframe(confirmations).map(c => {
            const cls = BADGE_CLASS[CONFIRMATION_PALETTE[c.confirmation_type] ?? 'slate']
            return (
              <span key={c.id} className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium ${cls}`}>
                {c.timeframe ? `${c.timeframe} ` : ''}{c.confirmation_type}
                <button onClick={() => remove(c.id)} className="ml-1 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-[#9ca3af]">{S.wizard.noConfirmations}</p>
      )}
    </div>
  )
}
