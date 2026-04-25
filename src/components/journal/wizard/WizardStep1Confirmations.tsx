import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { CONFIRMATION_TYPES } from '@/lib/constants/confirmations'
import { CONFIRMATION_PALETTE, BADGE_CLASS } from '@/lib/constants/palette'
import { TIMEFRAMES, sortByTimeframe } from '@/lib/constants/timeframes'
import { useS } from '@/lib/i18n'
import type { ConfirmationType, Timeframe, TradeConfirmation } from '@/types'

interface Props {
  confirmations: TradeConfirmation[]
  onChange: (confirmations: TradeConfirmation[]) => void
}

export function WizardStep1Confirmations({ confirmations, onChange }: Props) {
  const [selectedTf, setSelectedTf] = useState<Timeframe>('15M')
  const [selectedType, setSelectedType] = useState<ConfirmationType>('SSMT')
  const S = useS()

  const add = () => {
    if (confirmations.some(c => c.timeframe === selectedTf && c.confirmation_type === selectedType)) return
    onChange([...confirmations, { id: `tmp-${Date.now()}`, trade_id: '', timeframe: selectedTf, confirmation_type: selectedType, created_at: new Date().toISOString() }])
  }
  const remove = (id: string) => onChange(confirmations.filter(c => c.id !== id))

  const SEL = 'rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500'

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{S.wizard.confirmationsTitle}</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-[#9ca3af]">{S.wizard.confirmationsHint}</p>
      </div>
      <div className="flex items-center gap-2">
        <select value={selectedTf} onChange={e => setSelectedTf(e.target.value as Timeframe)} className={SEL}>
          {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
        </select>
        <select value={selectedType} onChange={e => setSelectedType(e.target.value as ConfirmationType)} className={SEL + ' flex-1'}>
          {CONFIRMATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={add} className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {confirmations.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {sortByTimeframe(confirmations).map(c => {
            const cls = BADGE_CLASS[CONFIRMATION_PALETTE[c.confirmation_type] ?? 'slate']
            return (
              <span key={c.id} className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium ${cls}`}>
                {c.timeframe} {c.confirmation_type}
                <button onClick={() => remove(c.id)} className="ml-1 hover:opacity-70"><X className="h-3 w-3" /></button>
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
