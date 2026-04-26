import { useState } from 'react'
import { Check, RotateCcw, ChevronDown } from 'lucide-react'
import { useUserPrefsStore } from '@/stores/useUserPrefsStore'
import {
  CONFIRMATIONS,
  CONFIRMATION_GROUP_LABELS,
  CONFIRMATION_COLORS,
  type ConfirmationDef,
} from '@/lib/constants/confirmations'
import {
  SYMBOLS_LIST,
  SYMBOL_CATEGORY_LABELS,
  type SymbolDef,
} from '@/lib/constants/symbols'
import { TIMEFRAMES } from '@/lib/constants/timeframes'
import { SYMBOL_COLORS } from '@/lib/constants/colors'
import type { ConfirmationType, Timeframe } from '@/types'

type Tab = 'symbols' | 'confirmations' | 'timeframes'

export function CustomizationSection() {
  const {
    enabledSymbols, enabledConfirmations, enabledTimeframes,
    toggleSymbol, toggleConfirmation, toggleTimeframe, resetDefaults,
  } = useUserPrefsStore()

  const [tab, setTab] = useState<Tab>('symbols')

  const TABS: { id: Tab; label: string; count: number; total: number }[] = [
    { id: 'symbols',       label: 'Pairs',        count: enabledSymbols.length,       total: SYMBOLS_LIST.length },
    { id: 'confirmations', label: 'Confluences',  count: enabledConfirmations.length, total: CONFIRMATIONS.length },
    { id: 'timeframes',    label: 'Timeframes',   count: enabledTimeframes.length,    total: TIMEFRAMES.length },
  ]

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Özelleştirme
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-[#9ca3af]">
            Trade eklerken sadece seçtiklerin görünür.
          </p>
        </div>
        <button
          onClick={resetDefaults}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-white/10 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-[#9ca3af] hover:bg-gray-50 dark:hover:bg-white/5"
          title="Reset to defaults"
        >
          <RotateCcw className="h-3 w-3" />
          Sıfırla
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 sm:px-6 pt-3 border-b border-gray-100 dark:border-white/5 overflow-x-auto scrollbar-light dark:scrollbar-dark">
        {TABS.map(t => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative whitespace-nowrap rounded-t-lg px-3 py-2 text-xs font-medium transition-colors ${
                active
                  ? 'text-[#415dff] dark:text-[#8a9eff]'
                  : 'text-gray-500 dark:text-[#9ca3af] hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-[10px] font-mono opacity-70">
                {t.count}/{t.total}
              </span>
              {active && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#415dff] dark:bg-[#8a9eff]" />
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {tab === 'symbols' && (
          <SymbolPicker enabled={enabledSymbols} onToggle={toggleSymbol} />
        )}
        {tab === 'confirmations' && (
          <ConfirmationPicker enabled={enabledConfirmations} onToggle={toggleConfirmation} />
        )}
        {tab === 'timeframes' && (
          <TimeframePicker enabled={enabledTimeframes} onToggle={toggleTimeframe} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Symbol picker — grouped by category
// ---------------------------------------------------------------------------
function SymbolPicker({ enabled, onToggle }: { enabled: string[]; onToggle: (s: string) => void }) {
  const groups = SYMBOLS_LIST.reduce<Record<string, SymbolDef[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {(Object.keys(groups) as SymbolDef['category'][]).map(cat => (
        <Group key={cat} title={SYMBOL_CATEGORY_LABELS[cat]}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {groups[cat].map(s => {
              const on = enabled.includes(s.code)
              const color = SYMBOL_COLORS[s.code] ?? '#9ca3af'
              return (
                <Pill
                  key={s.code}
                  selected={on}
                  color={color}
                  onClick={() => onToggle(s.code)}
                  label={s.code}
                  sublabel={s.name}
                />
              )
            })}
          </div>
        </Group>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirmation picker — grouped
// ---------------------------------------------------------------------------
function ConfirmationPicker({ enabled, onToggle }: { enabled: ConfirmationType[]; onToggle: (c: ConfirmationType) => void }) {
  const groups = CONFIRMATIONS.reduce<Record<string, ConfirmationDef[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {(Object.keys(groups) as ConfirmationDef['group'][]).map(g => (
        <Group key={g} title={CONFIRMATION_GROUP_LABELS[g]}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {groups[g].map(c => {
              const on = enabled.includes(c.type)
              const color = CONFIRMATION_COLORS[c.type] ?? '#9ca3af'
              return (
                <Pill
                  key={c.type}
                  selected={on}
                  color={color}
                  onClick={() => onToggle(c.type)}
                  label={c.type}
                  sublabel={c.needsTimeframe ? '' : 'no TF'}
                />
              )
            })}
          </div>
        </Group>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Timeframe picker
// ---------------------------------------------------------------------------
function TimeframePicker({ enabled, onToggle }: { enabled: Timeframe[]; onToggle: (t: Timeframe) => void }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
      {TIMEFRAMES.map(tf => {
        const on = enabled.includes(tf)
        return (
          <Pill
            key={tf}
            selected={on}
            color="#415dff"
            onClick={() => onToggle(tf)}
            label={tf}
          />
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-1.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9ca3af] hover:text-gray-700 dark:hover:text-white"
      >
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? '' : '-rotate-90'}`} />
        {title}
      </button>
      {open && children}
    </div>
  )
}

function Pill({
  selected, color, onClick, label, sublabel,
}: {
  selected: boolean
  color: string
  onClick: () => void
  label: string
  sublabel?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all active:scale-[0.97] ${
        selected
          ? 'border-transparent shadow-sm'
          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f] hover:border-gray-300 dark:hover:border-white/20'
      }`}
      style={selected ? { backgroundColor: `${color}22`, borderColor: `${color}66` } : undefined}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded shrink-0 transition ${
          selected ? '' : 'border border-gray-300 dark:border-white/20 bg-transparent'
        }`}
        style={selected ? { backgroundColor: color } : undefined}
      >
        {selected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
      </span>
      <div className="min-w-0">
        <p
          className="text-xs font-semibold truncate leading-tight"
          style={{ color: selected ? color : undefined }}
        >
          {label}
        </p>
        {sublabel && (
          <p className="text-[10px] text-gray-400 dark:text-[#6b7280] truncate leading-tight">
            {sublabel}
          </p>
        )}
      </div>
    </button>
  )
}
