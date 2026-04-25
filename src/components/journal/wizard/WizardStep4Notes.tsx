import { useS } from '@/lib/i18n'
import type { Outcome } from '@/types'

interface Props {
  value: string
  onChange: (v: string) => void
  outcome?: Outcome | null
}

export function WizardStep4Notes({ value, onChange, outcome }: Props) {
  const S = useS()
  const placeholder = outcome === 'win'
    ? S.wizard.notesPlaceholderWin
    : S.wizard.notesPlaceholder

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{S.wizard.notesTitle}</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-[#9ca3af]">{S.wizard.notesHint}</p>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
        className="w-full resize-none rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}
