import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { CONFIRMATION_TYPES, CONFIRMATION_COLORS } from '@/lib/constants/confirmations'
import { TIMEFRAMES } from '@/lib/constants/timeframes'
import type { ConfirmationType, Timeframe, TradeConfirmation } from '@/types'

interface Props {
  confirmations: TradeConfirmation[]
  onChange: (confirmations: TradeConfirmation[]) => void
}

export function WizardStep1Confirmations({ confirmations, onChange }: Props) {
  const [selectedTf, setSelectedTf] = useState<Timeframe>('15M')
  const [selectedType, setSelectedType] = useState<ConfirmationType>('SSMT')

  const add = () => {
    const already = confirmations.some(
      c => c.timeframe === selectedTf && c.confirmation_type === selectedType
    )
    if (already) return
    onChange([
      ...confirmations,
      {
        id: `tmp-${Date.now()}`,
        trade_id: '',
        timeframe: selectedTf,
        confirmation_type: selectedType,
        created_at: new Date().toISOString(),
      },
    ])
  }

  const remove = (id: string) => onChange(confirmations.filter(c => c.id !== id))

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-white">İşlemin Konfirmeleri neydi?</h3>
        <p className="mt-1 text-xs text-[#9ca3af]">TF ve konfirmasyon tipini seç, ekle.</p>
      </div>

      {/* Selector row */}
      <div className="flex items-center gap-2">
        <select
          value={selectedTf}
          onChange={e => setSelectedTf(e.target.value as Timeframe)}
          className="rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {TIMEFRAMES.map(tf => (
            <option key={tf} value={tf}>{tf}</option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={e => setSelectedType(e.target.value as ConfirmationType)}
          className="flex-1 rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {CONFIRMATION_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <button
          onClick={add}
          className="flex items-center gap-1 rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ekle
        </button>
      </div>

      {/* Chips */}
      {confirmations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {confirmations.map(c => {
            const color = CONFIRMATION_COLORS[c.confirmation_type] ?? '#9ca3af'
            return (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                style={{ backgroundColor: `${color}22`, color }}
              >
                {c.timeframe} {c.confirmation_type}
                <button onClick={() => remove(c.id)} className="ml-1 hover:opacity-70">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {confirmations.length === 0 && (
        <p className="text-xs text-[#9ca3af]">Henüz konfirmasyon eklenmedi. Bu adım atlanabilir.</p>
      )}
    </div>
  )
}
