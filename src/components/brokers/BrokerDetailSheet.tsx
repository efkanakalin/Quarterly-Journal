import { CheckCircle2, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { useS } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { BrokerCatalogEntry } from '@/lib/brokers/types'
import type { BrokerSlug } from '@/types'

interface Props {
  broker: BrokerCatalogEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnect: (slug: BrokerSlug) => void
  connecting: boolean
  configured: boolean
}

interface BrokerCopy {
  blurb: string
  whatYouGet: readonly string[]
  requirements: readonly string[]
  steps: readonly string[]
}

export function BrokerDetailSheet({
  broker, open, onOpenChange, onConnect, connecting, configured,
}: Props) {
  const S = useS()

  if (!broker) return null

  const copy: BrokerCopy =
    broker.slug === 'tradovate'
      ? {
          blurb:        S.brokers.tradovateBlurb,
          whatYouGet:   S.brokers.tradovateGet,
          requirements: S.brokers.tradovateReq,
          steps:        S.brokers.tradovateSteps,
        }
      : broker.slug === 'mt4'
      ? {
          blurb:        S.brokers.mt4Blurb,
          whatYouGet:   S.brokers.mt4Get,
          requirements: S.brokers.mt4Req,
          steps:        S.brokers.mt4Steps,
        }
      : broker.slug === 'binance'
      ? {
          blurb:        S.brokers.binanceBlurb,
          whatYouGet:   S.brokers.binanceGet,
          requirements: S.brokers.binanceReq,
          steps:        S.brokers.binanceSteps,
        }
      : {
          blurb:        S.brokers.ibkrBlurb,
          whatYouGet:   S.brokers.ibkrGet,
          requirements: S.brokers.ibkrReq,
          steps:        S.brokers.ibkrSteps,
        }

  const canConnect = broker.available && configured
  const showNotConfiguredBanner = broker.available && !configured
  const showComingSoonBanner    = !broker.available

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full data-[side=right]:sm:max-w-lg overflow-y-auto p-0"
      >
        {/* Hero */}
        <div className="border-b border-gray-200 dark:border-white/10 bg-gradient-to-b from-gray-50 to-white dark:from-[#1a1a1a] dark:to-[#141414] px-6 pt-6 pb-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-200 dark:ring-white/10 bg-white dark:bg-white/5">
              <img src={broker.logo} alt={broker.name} className="h-full w-full object-contain p-1.5" />
            </div>
            <div className="min-w-0">
              <SheetHeader className="space-y-1 p-0">
                <SheetTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  {broker.name}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {broker.available ? S.brokers.statusAvailable : S.brokers.statusComingSoon}
                </SheetDescription>
              </SheetHeader>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-[#9ca3af]">
            {copy.blurb}
          </p>
        </div>

        {/* Banners */}
        <div className="px-6 pt-5 space-y-3">
          {showComingSoonBanner && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{S.brokers.detailComingSoon}</span>
            </div>
          )}
          {showNotConfiguredBanner && (
            <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{S.brokers.detailNotConfigured}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          <Section title={S.brokers.detailWhatYouGet}>
            <ul className="space-y-2">
              {copy.whatYouGet.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-[#d1d5db]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={S.brokers.detailRequirements}>
            <ul className="space-y-1.5">
              {copy.requirements.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-gray-700 dark:text-[#d1d5db] before:mr-2 before:text-gray-400 dark:before:text-[#6b7280] before:content-['•']"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Section>

          <Section title={S.brokers.detailHowToConnect}>
            <ol className="space-y-3">
              {copy.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#415dff]/10 text-[11px] font-semibold text-[#415dff] dark:bg-[#415dff]/15 dark:text-[#8a9eff]">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-700 dark:text-[#d1d5db]">{step}</p>
                </li>
              ))}
            </ol>
          </Section>
        </div>

        <SheetFooter className="border-t border-gray-200 dark:border-white/10 px-6 py-4 sticky bottom-0 bg-white dark:bg-[#141414]">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-initial"
          >
            {S.brokers.detailClose}
          </Button>
          <Button
            onClick={() => onConnect(broker.slug)}
            disabled={!canConnect || connecting}
            className="flex-1 sm:flex-initial"
          >
            {connecting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {broker.available
              ? (configured ? S.brokers.detailConnect : S.brokers.detailConnect)
              : S.brokers.statusComingSoon}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9ca3af]">
        {title}
      </h3>
      {children}
    </div>
  )
}
