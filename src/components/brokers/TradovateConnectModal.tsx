import { useEffect, useState } from 'react'
import { ExternalLink, Info, Loader2 } from 'lucide-react'
import { useS } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { defaultTokenExpiry, listAccounts } from '@/lib/brokers/tradovate'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBrokerConnectionsStore } from '@/stores/useBrokerConnectionsStore'
import type { BrokerConnection } from '@/types'

const TRADOVATE_HELP_URL = 'https://api.tradovate.com'
// İlk senkron'un default'u: son 30 gün.
const TODAY_ISO = () => new Date().toISOString().slice(0, 10)
const THIRTY_DAYS_AGO_ISO = () => new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10)

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConnected: (connection: BrokerConnection) => void
}

/**
 * Tradovate manuel-token bağlantı modal'ı: kullanıcı Tradovate'ten
 * kendi access token'ını + account ID'sini alıp buraya yapıştırır;
 * uygulama token'ı /accounts ile doğrular, doğrulanırsa
 * broker_connections'a yazar ve kapanır.
 *
 * OAuth client_id/secret kullanılmaz; backend'de CORS proxy worker
 * yeterlidir (sadece VITE_TRADOVATE_WORKER_URL).
 */
export function TradovateConnectModal({ open, onOpenChange, onConnected }: Props) {
  const S = useS()
  const user = useAuthStore(s => s.user)
  const { upsertConnection } = useBrokerConnectionsStore()

  const [token, setToken]         = useState('')
  const [accountId, setAccountId] = useState('')
  const [fromDate, setFromDate]   = useState<string>(THIRTY_DAYS_AGO_ISO())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setToken('')
      setAccountId('')
      setFromDate(THIRTY_DAYS_AGO_ISO())
      setError(null)
      setSubmitting(false)
    }
  }, [open])

  const submit = async () => {
    setError(null)
    if (!user) return
    if (!token.trim()) { setError(S.brokers.connectErrTokenEmpty); return }
    if (!accountId.trim()) { setError(S.brokers.connectErrAccountEmpty); return }

    setSubmitting(true)
    try {
      // 1) Token'ı /accounts ile doğrula ve kullanıcının verdiği account_id
      //    o token altında gerçekten görünüyor mu kontrol et.
      const accounts = await listAccounts(token.trim())
      const match = accounts.find(a => String(a.id) === accountId.trim())
      if (!match) {
        setError(S.brokers.connectErrAccountNotFound)
        setSubmitting(false)
        return
      }
      const isDemo = (match.legalStatus ?? '').toLowerCase().includes('demo')
      const accountIdKey = isDemo ? `demo_${match.id}` : String(match.id)

      // 2) DB'ye yaz. Tradovate'te ayrı refresh token yok, access token'ın
      //    kendisi /renewaccesstoken için kullanılır.
      const { data, error: dbErr } = await supabase
        .from('broker_connections')
        .upsert({
          user_id:          user.id,
          broker:           'tradovate',
          account_id:       accountIdKey,
          account_label:    match.nickname || match.name,
          is_demo:          isDemo,
          access_token:     token.trim(),
          refresh_token:    token.trim(),
          token_expires_at: defaultTokenExpiry(),
          last_synced_at:   fromDate ? new Date(fromDate + 'T00:00:00Z').toISOString() : null,
          last_sync_status: null,
          last_sync_error:  null,
        }, { onConflict: 'user_id,broker,account_id' })
        .select()
        .single()

      if (dbErr) throw dbErr
      if (!data) throw new Error('No row returned')

      const conn = data as BrokerConnection
      upsertConnection(conn)
      onConnected(conn)
      onOpenChange(false)
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const msg = raw === 'invalid_token'  ? S.brokers.connectErrInvalidToken
                : raw === 'rate_limited'   ? S.brokers.rateLimited
                : raw === 'tradovate_not_configured' ? S.brokers.notConfiguredToast
                : raw
      setError(msg)
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{S.brokers.connectModalTitle}</DialogTitle>
          <DialogDescription>{S.brokers.connectModalSubtitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1 — open Tradovate */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-400/30 dark:bg-blue-400/10">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-300" />
              <div className="space-y-2 text-xs text-blue-800 dark:text-blue-200">
                <p>{S.brokers.connectStep1}</p>
                <a
                  href={TRADOVATE_HELP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-blue-700"
                >
                  {S.brokers.connectOpenTradovate}<ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* API Token */}
          <Field label={S.brokers.connectTokenLabel} hint={S.brokers.connectTokenHint}>
            <textarea
              value={token}
              onChange={e => setToken(e.target.value)}
              rows={3}
              placeholder="eyJhbGciOiJIUz…"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono text-gray-900 focus:border-[#415dff] focus:outline-none focus:ring-1 focus:ring-[#415dff]/40 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white"
              disabled={submitting}
              autoComplete="off"
              spellCheck={false}
            />
          </Field>

          {/* Account ID */}
          <Field label={S.brokers.connectAccountLabel} hint={S.brokers.connectAccountHint}>
            <input
              type="text"
              inputMode="numeric"
              value={accountId}
              onChange={e => setAccountId(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="123456"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-mono text-gray-900 focus:border-[#415dff] focus:outline-none focus:ring-1 focus:ring-[#415dff]/40 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white"
              disabled={submitting}
              autoComplete="off"
            />
          </Field>

          {/* Sync from date */}
          <Field label={S.brokers.connectFromDateLabel} hint={S.brokers.connectFromDateHint}>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                max={TODAY_ISO()}
                onChange={e => setFromDate(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#415dff] focus:outline-none focus:ring-1 focus:ring-[#415dff]/40 dark:border-white/10 dark:bg-[#0f0f0f] dark:text-white"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setFromDate('')}
                className="text-xs text-gray-500 hover:text-gray-700 dark:text-[#9ca3af] dark:hover:text-white"
                disabled={submitting}
              >
                {S.brokers.connectClearDate}
              </button>
            </div>
          </Field>

          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {S.brokers.cancelButton}
          </Button>
          <Button onClick={submit} disabled={submitting || !token.trim() || !accountId.trim()}>
            {submitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {S.brokers.connectCreateButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-semibold text-gray-700 dark:text-[#d1d5db]">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-gray-500 dark:text-[#9ca3af]">{hint}</span>}
    </label>
  )
}
