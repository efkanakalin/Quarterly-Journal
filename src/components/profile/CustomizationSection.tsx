import { useState } from 'react'
import { Check, RotateCcw, ChevronDown, Plus } from 'lucide-react'
import { useUserPrefsStore } from '@/stores/useUserPrefsStore'
import { useS } from '@/lib/i18n'
import {
  CONFIRMATIONS,
  CONFIRMATION_COLORS,
  type ConfirmationDef,
} from '@/lib/constants/confirmations'
import {
  SYMBOLS_LIST,
  type SymbolDef,
} from '@/lib/constants/symbols'
import { TIMEFRAMES } from '@/lib/constants/timeframes'
import { JOURNAL_COLUMNS, type JournalColumnId } from '@/lib/constants/journalColumns'
import { SYMBOL_COLORS } from '@/lib/constants/colors'
import type { ConfirmationType, Timeframe } from '@/types'

type Tab = 'symbols' | 'confirmations' | 'timeframes' | 'columns'

export function CustomizationSection() {
  const {
    enabledSymbols, enabledConfirmations, enabledTimeframes, enabledColumns,
    customConfirmations, customSymbols,
    toggleSymbol, toggleConfirmation, toggleTimeframe, toggleColumn, resetDefaults,
    addCustomConfirmation, addCustomSymbol,
  } = useUserPrefsStore()
  const S = useS()

  const [tab, setTab] = useState<Tab>('symbols')

  const TABS: { id: Tab; label: string; count: number; total: number }[] = [
    { id: 'symbols',       label: S.customization.pairs,      count: enabledSymbols.length,       total: SYMBOLS_LIST.length + customSymbols.length },
    { id: 'confirmations', label: S.customization.entries,    count: enabledConfirmations.length, total: CONFIRMATIONS.length + customConfirmations.length },
    { id: 'timeframes',    label: S.customization.timeframes, count: enabledTimeframes.length,    total: TIMEFRAMES.length },
    { id: 'columns',       label: S.customization.columns,    count: enabledColumns.length,       total: JOURNAL_COLUMNS.length },
  ]

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {S.customization.title}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-[#9ca3af]">
            {S.customization.subtitle}
          </p>
        </div>
        <button
          onClick={resetDefaults}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-white/10 px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-[#9ca3af] hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <RotateCcw className="h-3 w-3" />
          {S.customization.reset}
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
          <SymbolPicker
            enabled={enabledSymbols}
            onToggle={toggleSymbol}
            customLabels={customSymbols}
            onAddCustom={addCustomSymbol}
          />
        )}
        {tab === 'confirmations' && (
          <ConfirmationPicker
            enabled={enabledConfirmations}
            onToggle={toggleConfirmation}
            customLabels={customConfirmations}
            onAddCustom={addCustomConfirmation}
          />
        )}
        {tab === 'timeframes' && (
          <TimeframePicker enabled={enabledTimeframes} onToggle={toggleTimeframe} />
        )}
        {tab === 'columns' && (
          <ColumnPicker enabled={enabledColumns} onToggle={toggleColumn} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Symbol picker — grouped by category + custom labels
// ---------------------------------------------------------------------------
function SymbolPicker({
  enabled, onToggle, customLabels, onAddCustom,
}: {
  enabled: string[]
  onToggle: (s: string) => void
  customLabels: string[]
  onAddCustom: (code: string) => void
}) {
  const S = useS()
  const [draft, setDraft] = useState('')

  const groups = SYMBOLS_LIST.reduce<Record<string, SymbolDef[]>>((acc, s) => {
    (acc[s.category] ??= []).push(s)
    return acc
  }, {})

  const submitCustom = () => {
    const v = draft.trim()
    if (!v) return
    onAddCustom(v)
    setDraft('')
  }

  return (
    <div className="space-y-5">
      {(Object.keys(groups) as SymbolDef['category'][]).map(cat => (
        <Group key={cat} title={S.customization.symbolGroups[cat]}>
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

      {/* Custom symbols */}
      <Group title={S.customization.groups.CUSTOM}>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitCustom() } }}
              maxLength={16}
              placeholder={S.customization.customPairPlaceholder}
              className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f] px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#415dff]/40 focus:border-[#415dff] uppercase"
            />
            <button
              type="button"
              onClick={submitCustom}
              disabled={!draft.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-[#415dff] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2f4ae6] disabled:opacity-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {S.customization.customAdd}
            </button>
          </div>

          {customLabels.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {customLabels.map(label => {
                const on = enabled.includes(label)
                return (
                  <Pill
                    key={label}
                    selected={on}
                    color="#a855f7"
                    onClick={() => onToggle(label)}
                    label={label}
                  />
                )
              })}
            </div>
          )}
        </div>
      </Group>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirmation picker — grouped + custom labels
// ---------------------------------------------------------------------------
function ConfirmationPicker({
  enabled, onToggle, customLabels, onAddCustom,
}: {
  enabled: ConfirmationType[]
  onToggle: (c: ConfirmationType) => void
  customLabels: string[]
  onAddCustom: (label: string) => void
}) {
  const S = useS()
  const [draft, setDraft] = useState('')

  const groups = CONFIRMATIONS.reduce<Record<string, ConfirmationDef[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c)
    return acc
  }, {})

  const submitCustom = () => {
    const v = draft.trim()
    if (!v) return
    onAddCustom(v)
    setDraft('')
  }

  return (
    <div className="space-y-5">
      {(Object.keys(groups) as ConfirmationDef['group'][]).map(g => (
        <Group key={g} title={S.customization.groups[g]}>
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
                  sublabel={c.needsTimeframe ? '' : S.customization.noTf}
                />
              )
            })}
          </div>
        </Group>
      ))}

      {/* Custom entries */}
      <Group title={S.customization.groups.CUSTOM}>
        <div className="space-y-2">
          {/* Add input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitCustom() } }}
              maxLength={24}
              placeholder={S.customization.customAddPlaceholder}
              className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f0f0f] px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#415dff]/40 focus:border-[#415dff]"
            />
            <button
              type="button"
              onClick={submitCustom}
              disabled={!draft.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-[#415dff] px-3 py-2 text-xs font-semibold text-white hover:bg-[#2f4ae6] disabled:opacity-50 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              {S.customization.customAdd}
            </button>
          </div>

          {/* Existing custom labels — silme yok; istemiyorsan toggle ile gizle */}
          {customLabels.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {customLabels.map(label => {
                const on = enabled.includes(label as ConfirmationType)
                return (
                  <Pill
                    key={label}
                    selected={on}
                    color="#a855f7"
                    onClick={() => onToggle(label as ConfirmationType)}
                    label={label}
                  />
                )
              })}
            </div>
          )}
        </div>
      </Group>
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
// Column picker — Journal table column visibility
// ---------------------------------------------------------------------------
function ColumnPicker({ enabled, onToggle }: { enabled: JournalColumnId[]; onToggle: (c: JournalColumnId) => void }) {
  const S = useS()
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-[#9ca3af]">{S.customization.columnsHint}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {JOURNAL_COLUMNS.map(col => {
          const on = enabled.includes(col.id)
          return (
            <Pill
              key={col.id}
              selected={on}
              color="#415dff"
              onClick={() => onToggle(col.id)}
              label={S.customization.columnLabels[col.id]}
            />
          )
        })}
      </div>
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
