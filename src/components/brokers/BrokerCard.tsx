import { ChevronRight } from 'lucide-react'
import { useS } from '@/lib/i18n'
import type { BrokerCatalogEntry } from '@/lib/brokers/types'

interface Props {
  broker: BrokerCatalogEntry
  onSelect: (slug: BrokerCatalogEntry['slug']) => void
}

/**
 * "Available Brokers" grid kartı. Bir broker'a tıklamak Connect akışını
 * doğrudan başlatmaz; önce BrokerDetailSheet'i açar — kullanıcı orada
 * adım adım talimatları görür ve oradan Connect'e basar.
 */
export function BrokerCard({ broker, onSelect }: Props) {
  const S = useS()
  const muted = !broker.available

  return (
    <button
      type="button"
      onClick={() => onSelect(broker.slug)}
      className={`group relative flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
        muted
          ? 'border-gray-200 bg-white opacity-70 hover:opacity-100 hover:border-gray-300 dark:border-white/10 dark:bg-[#141414] dark:hover:border-white/20'
          : 'border-gray-200 bg-white hover:border-[#415dff]/40 hover:bg-[#415dff]/5 dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:border-[#415dff]/40 dark:hover:bg-[#415dff]/5'
      }`}
    >
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-gray-200 dark:ring-white/10 bg-white dark:bg-white/5">
        <img src={broker.logo} alt={broker.name} className="h-full w-full object-contain p-1.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{broker.name}</p>
        <span
          className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
            broker.available
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
              : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-[#9ca3af]'
          }`}
        >
          {broker.available ? S.brokers.statusAvailable : S.brokers.statusComingSoon}
        </span>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500 dark:text-[#3a3a3a] dark:group-hover:text-[#9ca3af]" />
    </button>
  )
}
