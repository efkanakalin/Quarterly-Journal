import { useS } from '@/lib/i18n'

interface Props { value: string; onChange: (v: string) => void }

export function WizardStep4Notes({ value, onChange }: Props) {
  const S = useS()
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{S.wizard.notesTitle}</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-[#9ca3af]">{S.wizard.notesHint}</p>
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={S.wizard.notesPlaceholder}
        rows={6}
        className="w-full resize-none rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}
