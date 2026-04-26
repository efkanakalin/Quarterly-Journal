import { MISTAKE_TYPES, MISTAKE_LABELS_EN, MISTAKE_LABELS_TR } from '@/lib/constants/mistakes'
import { useS } from '@/lib/i18n'
import { useLangStore } from '@/stores/useLangStore'
import type { MistakeType, Outcome } from '@/types'

interface Props {
  outcome: Outcome | null
  rMultiple: string
  onRMultipleChange: (v: string) => void
  mistakes: MistakeType[]
  onMistakesChange: (v: MistakeType[]) => void
}

export function WizardStep3Outcome({ outcome, rMultiple, onRMultipleChange, mistakes, onMistakesChange }: Props) {
  const S = useS()
  const lang = useLangStore(s => s.lang)
  const labels = lang === 'tr' ? MISTAKE_LABELS_TR : MISTAKE_LABELS_EN
  const toggleMistake = (m: MistakeType) =>
    onMistakesChange(mistakes.includes(m) ? mistakes.filter(x => x !== m) : [...mistakes, m])

  return (
    <div className="space-y-5">
      {outcome === 'win' ? (
        <>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{S.wizard.winRTitle}</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-[#9ca3af]">{S.wizard.winRHint}</p>
          </div>
          <input
            type="number" step="0.1" min="0" value={rMultiple}
            onChange={e => onRMultipleChange(e.target.value)}
            placeholder="e.g. 2.5"
            className="w-full rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </>
      ) : (
        <>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{S.wizard.mistakeTitle}</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-[#9ca3af]">{S.wizard.mistakeHint}</p>
          </div>
          <div className="space-y-2">
            {MISTAKE_TYPES.map(m => (
              <label key={m} className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-white/10 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <input type="checkbox" checked={mistakes.includes(m)} onChange={() => toggleMistake(m)} className="h-4 w-4 rounded accent-red-500" />
                <span className="text-sm text-gray-900 dark:text-white">{labels[m]}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
