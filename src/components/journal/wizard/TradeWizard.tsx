import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { sanitizeUrl } from '@/lib/security/url'
import { useTradesStore } from '@/stores/useTradesStore'
import { useS } from '@/lib/i18n'
import { WizardStep1Confirmations } from './WizardStep1Confirmations'
import { WizardStep2ChartLink } from './WizardStep2ChartLink'
import { WizardStep3Outcome } from './WizardStep3Outcome'
import { WizardStep4Notes } from './WizardStep4Notes'
import type { TradeWithRelations, TradeConfirmation, MistakeType } from '@/types'

interface Props {
  trade: TradeWithRelations
  open: boolean
  onClose: () => void
  onComplete: (tradeId: string) => void
  initialStep?: number
}

const TOTAL_STEPS = 4

export function TradeWizard({ trade, open, onClose, onComplete, initialStep = 1 }: Props) {
  const { updateTrade } = useTradesStore()
  const S = useS()
  const [step, setStep] = useState(initialStep)
  const [saving, setSaving] = useState(false)

  const [confirmations, setConfirmations] = useState<TradeConfirmation[]>([])
  const [chartLink, setChartLink] = useState('')
  const [rMultiple, setRMultiple] = useState('')
  const [mistakes, setMistakes] = useState<MistakeType[]>([])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setStep(initialStep)
      setConfirmations(trade.trade_confirmations ?? [])
      setChartLink(trade.chart_link ?? '')
      setRMultiple(trade.r_multiple != null ? String(trade.r_multiple) : '')
      setMistakes((trade.trade_mistakes ?? []).map(m => m.mistake_type as MistakeType))
      setNotes(trade.notes ?? '')
    }
  }, [trade.id, open, initialStep])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, confirmations, chartLink, rMultiple, mistakes, notes])

  const saveStep = async (currentStep: number) => {
    setSaving(true)
    try {
      if (currentStep === 1) {
        await supabase.from('trade_confirmations').delete().eq('trade_id', trade.id)
        if (confirmations.length > 0) {
          const { error } = await supabase.from('trade_confirmations').insert(
            confirmations.map(c => ({
              trade_id: trade.id,
              timeframe: c.timeframe,
              confirmation_type: c.confirmation_type,
            }))
          )
          if (error) throw error
        }
        // Fetch updated confirmations to sync store
        const { data } = await supabase
          .from('trade_confirmations')
          .select('*')
          .eq('trade_id', trade.id)
        updateTrade(trade.id, {}, data ?? [], undefined)
      } else if (currentStep === 2) {
        const safeLink = sanitizeUrl(chartLink)
        const { error } = await supabase
          .from('trades')
          .update({ chart_link: safeLink })
          .eq('id', trade.id)
        if (error) throw error
        updateTrade(trade.id, { chart_link: safeLink })
      } else if (currentStep === 3) {
        if (trade.outcome === 'win') {
          const r = rMultiple ? parseFloat(rMultiple) : null
          const { error } = await supabase
            .from('trades')
            .update({ r_multiple: r })
            .eq('id', trade.id)
          if (error) throw error
          updateTrade(trade.id, { r_multiple: r })
        } else {
          // Auto r_multiple: loss → -1, breakeven → 0
          const autoR = trade.outcome === 'loss' ? -1 : 0
          const { error: rErr } = await supabase
            .from('trades')
            .update({ r_multiple: autoR })
            .eq('id', trade.id)
          if (rErr) throw rErr
          updateTrade(trade.id, { r_multiple: autoR })

          await supabase.from('trade_mistakes').delete().eq('trade_id', trade.id)
          if (mistakes.length > 0) {
            const { error } = await supabase.from('trade_mistakes').insert(
              mistakes.map(m => ({ trade_id: trade.id, mistake_type: m }))
            )
            if (error) throw error
          }
          const { data: mistakesData } = await supabase
            .from('trade_mistakes')
            .select('*')
            .eq('trade_id', trade.id)
          updateTrade(trade.id, {}, undefined, mistakesData ?? [])
        }
      } else if (currentStep === 4) {
        const { error } = await supabase
          .from('trades')
          .update({ notes: notes || null })
          .eq('id', trade.id)
        if (error) throw error
        updateTrade(trade.id, { notes: notes || null })
      }
    } catch {
      toast.error('Kaydetme hatası.')
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    await saveStep(step)
    setStep(s => s + 1)
  }

  const handlePrev = () => setStep(s => s - 1)

  const handleClose = async () => {
    await saveStep(step)
    onClose()
  }

  const handleFinish = async () => {
    await saveStep(step)
    const { error } = await supabase
      .from('trades')
      .update({ is_complete: true })
      .eq('id', trade.id)
    if (error) {
      toast.error('Tamamlama hatası.')
      return
    }
    updateTrade(trade.id, { is_complete: true })
    toast.success('Trade tamamlandı.')
    onComplete(trade.id)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center bg-black/60 sm:p-4">
      <div className="w-full sm:max-w-md sm:rounded-xl border-0 sm:border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] flex flex-col shadow-xl max-h-screen sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-200 dark:border-white/10 shrink-0">
          <span className="text-xs text-gray-500 dark:text-[#9ca3af] font-mono truncate">
            {trade.symbol} · {trade.outcome?.toUpperCase()} ·{' '}
            {trade.pnl_usd != null
              ? `${trade.pnl_usd >= 0 ? '+' : ''}$${trade.pnl_usd.toFixed(2)}`
              : '—'}
          </span>
          <button
            onClick={handleClose}
            disabled={saving}
            className="rounded-md p-2 text-gray-500 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50 shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step content */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 min-h-[260px] flex-1 overflow-y-auto">
          {step === 1 && (
            <WizardStep1Confirmations
              confirmations={confirmations}
              onChange={setConfirmations}
            />
          )}
          {step === 2 && (
            <WizardStep2ChartLink value={chartLink} onChange={setChartLink} />
          )}
          {step === 3 && (
            <WizardStep3Outcome
              outcome={trade.outcome}
              rMultiple={rMultiple}
              onRMultipleChange={setRMultiple}
              mistakes={mistakes}
              onMistakesChange={setMistakes}
            />
          )}
          {step === 4 && (
            <WizardStep4Notes value={notes} onChange={setNotes} outcome={trade.outcome} />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 sm:px-6 pb-4 sm:pb-5 pt-3 sm:pt-4 border-t border-gray-200 dark:border-white/10 shrink-0">
          {/* Pagination dots — logo moru */}
          <div className="flex gap-1.5 items-center">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
              const current = i + 1 === step
              const past = i + 1 < step
              return (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-200 ${current ? 'w-4' : 'w-1.5'}`}
                  style={{
                    backgroundColor: current
                      ? '#415dff'
                      : past
                        ? 'rgba(65,93,255,0.4)'
                        : 'rgba(148,148,148,0.25)',
                  }}
                />
              )
            })}
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={step === 1 || saving}
              className="rounded-md p-2 text-gray-500 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {step < TOTAL_STEPS ? (
              <button
                onClick={handleNext}
                disabled={saving}
                className="rounded-md p-2 text-gray-500 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: '#415dff' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2f4ae6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#415dff')}
              >
                {saving ? '...' : S.journal.finishButton}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
