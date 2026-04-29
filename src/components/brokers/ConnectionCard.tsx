import { useState } from 'react'
import { RefreshCw, Plug, Trash2, AlertTriangle } from 'lucide-react'
import { useS } from '@/lib/i18n'
import { formatRelativeTime } from '@/lib/brokers/relativeTime'
import { BROKER_CATALOG } from '@/lib/brokers/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { BrokerConnection } from '@/types'

interface Props {
  connection: BrokerConnection
  syncing?: boolean
  onSync: (id: string) => void
  onReconnect: (slug: BrokerConnection['broker']) => void
  onDisconnect: (id: string) => Promise<void>
}

export function ConnectionCard({ connection, syncing, onSync, onReconnect, onDisconnect }: Props) {
  const S = useS()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const meta = BROKER_CATALOG.find(b => b.slug === connection.broker)
  const tokenExpired = connection.last_sync_status === 'token_expired'
  const failed = connection.last_sync_status === 'failed'
  const errorLabel = connection.last_sync_error === 'rate_limited'
    ? S.brokers.rateLimited
    : connection.last_sync_error

  const statusLabel = tokenExpired
    ? S.brokers.statusTokenExpired
    : failed
    ? S.brokers.statusSyncFailed
    : connection.last_synced_at
    ? S.brokers.statusActive
    : S.brokers.statusNeverSynced

  const statusClass = tokenExpired
    ? 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300'
    : failed
    ? 'bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300'
    : connection.last_synced_at
    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
    : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-[#9ca3af]'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-[#1a1a1a]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Identity */}
        <div className="flex items-center gap-3 min-w-0">
          {meta && (
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              <img src={meta.logo} alt={meta.name} className="h-full w-full object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {meta?.name ?? connection.broker}
              </p>
              {connection.is_demo && (
                <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-300">
                  {S.brokers.badgeDemo}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-[#9ca3af]">
              {connection.account_label || connection.account_id}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
                {statusLabel}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-[#9ca3af]">
                {S.brokers.lastSynced} {formatRelativeTime(connection.last_synced_at, S)}
              </span>
            </div>
            {failed && errorLabel && (
              <p className="mt-1.5 flex items-start gap-1 text-[11px] text-rose-600 dark:text-rose-300">
                <AlertTriangle className="mt-[1px] h-3 w-3 shrink-0" />
                <span className="break-words">{errorLabel}</span>
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-wrap gap-2">
          {tokenExpired ? (
            <button
              onClick={() => onReconnect(connection.broker)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/15"
            >
              <Plug className="h-3.5 w-3.5" />
              {S.brokers.reconnect}
            </button>
          ) : (
            <button
              onClick={() => onSync(connection.id)}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-[#d1d5db] dark:hover:bg-white/5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? S.brokers.syncing : S.brokers.syncNow}
            </button>
          )}

          <button
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-[#9ca3af] dark:hover:border-rose-400/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {S.brokers.disconnect}
          </button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{S.brokers.disconnectTitle}</AlertDialogTitle>
            <AlertDialogDescription>{S.brokers.disconnectBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{S.brokers.cancelButton}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onDisconnect(connection.id)
                setConfirmOpen(false)
              }}
              className="bg-rose-600 hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-400"
            >
              {S.brokers.disconnect}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
