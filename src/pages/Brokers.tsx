import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useS } from '@/lib/i18n'
import { BROKER_CATALOG, type BrokerCatalogEntry } from '@/lib/brokers/types'
import { startTradovateConnect, isTradovateConfigured } from '@/lib/brokers/tradovate'
import { syncTradovateConnection } from '@/lib/brokers/tradovateSync'
import { useBrokerConnectionsStore } from '@/stores/useBrokerConnectionsStore'
import { useTradesStore } from '@/stores/useTradesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { BrokerCard } from '@/components/brokers/BrokerCard'
import { ConnectionCard } from '@/components/brokers/ConnectionCard'
import { BrokerDetailSheet } from '@/components/brokers/BrokerDetailSheet'
import type { BrokerSlug } from '@/types'

export function Brokers() {
  const S = useS()
  const user = useAuthStore(s => s.user)
  const { connections, loading, fetchConnections, removeConnection, patchConnection } = useBrokerConnectionsStore()
  const addTrade = useTradesStore(s => s.addTrade)
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [activeBroker, setActiveBroker] = useState<BrokerCatalogEntry | null>(null)

  const tradovateReady = isTradovateConfigured()

  useEffect(() => { fetchConnections() }, [fetchConnections])

  // Bir broker kartına tıklayınca detay sheet'i açılır; bağlantı oradan başlar.
  const handleSelect = (slug: BrokerSlug) => {
    const entry = BROKER_CATALOG.find(b => b.slug === slug)
    if (entry) setActiveBroker(entry)
  }

  const handleConnect = async (slug: BrokerSlug) => {
    if (!user) return
    if (slug !== 'tradovate') {
      toast.message(S.brokers.comingSoonToast)
      return
    }
    if (!tradovateReady) {
      toast.error(S.brokers.notConfiguredToast)
      return
    }
    setConnecting(true)
    try {
      await startTradovateConnect()
    } catch (err) {
      console.error(err)
      const raw = err instanceof Error ? err.message : ''
      const msg = raw === 'tradovate_not_configured'
        ? S.brokers.notConfiguredToast
        : raw || S.brokers.serviceUnavailable
      toast.error(msg)
      setConnecting(false)
    }
  }

  const handleSync = async (id: string) => {
    const conn = connections.find(c => c.id === id)
    if (!conn || !user) return
    setSyncingId(id)
    try {
      const result = await syncTradovateConnection(conn, user.id, addTrade, patchConnection)
      if (result.imported === 0 && result.skipped === 0) {
        toast.message(S.brokers.syncEmpty)
      } else {
        toast.success(S.brokers.syncSuccess(result.imported, result.skipped))
      }
    } catch (err) {
      console.error(err)
      const raw = err instanceof Error ? err.message : undefined
      const description = raw === 'rate_limited'
        ? S.brokers.rateLimited
        : raw === 'tradovate_not_configured'
        ? S.brokers.notConfiguredToast
        : raw
      toast.error(S.brokers.syncFailedToast, { description })
    } finally {
      setSyncingId(null)
    }
  }

  const handleDisconnect = async (id: string) => {
    try {
      await removeConnection(id)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : S.brokers.serviceUnavailable)
    }
  }

  const handleReconnect = async (slug: BrokerSlug) => {
    if (slug !== 'tradovate') return
    if (!tradovateReady) {
      toast.error(S.brokers.notConfiguredToast)
      return
    }
    setConnecting(true)
    try {
      await startTradovateConnect()
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : S.brokers.serviceUnavailable)
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{S.brokers.title}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-[#9ca3af]">{S.brokers.subtitle}</p>
      </div>

      {/* Section A — My Connections */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9ca3af]">
          {S.brokers.myConnections}
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 1 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#141414]">
            <p className="text-sm text-gray-500 dark:text-[#9ca3af]">{S.brokers.emptyConnections}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map(conn => (
              <ConnectionCard
                key={conn.id}
                connection={conn}
                syncing={syncingId === conn.id}
                onSync={handleSync}
                onReconnect={handleReconnect}
                onDisconnect={handleDisconnect}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section B — Available Brokers */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9ca3af]">
          {S.brokers.availableBrokers}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {BROKER_CATALOG.map(broker => (
            <BrokerCard
              key={broker.slug}
              broker={broker}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </section>

      <BrokerDetailSheet
        broker={activeBroker}
        open={activeBroker !== null}
        onOpenChange={open => { if (!open) setActiveBroker(null) }}
        onConnect={handleConnect}
        connecting={connecting && activeBroker?.slug === 'tradovate'}
        configured={activeBroker?.slug === 'tradovate' ? tradovateReady : false}
      />
    </div>
  )
}
