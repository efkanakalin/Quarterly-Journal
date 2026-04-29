import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useS } from '@/lib/i18n'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBrokerConnectionsStore } from '@/stores/useBrokerConnectionsStore'
import { useTradesStore } from '@/stores/useTradesStore'
import {
  exchangeCode,
  listAccounts,
  TRADOVATE_OAUTH_STATE_KEY,
} from '@/lib/brokers/tradovate'
import { syncTradovateConnection } from '@/lib/brokers/tradovateSync'
import { supabase } from '@/lib/supabase'
import { AccountSelectModal } from '@/components/brokers/AccountSelectModal'
import type { TradovateAccount, TradovateTokenResponse } from '@/lib/brokers/types'
import type { BrokerConnection } from '@/types'

type Status = 'verifying' | 'fetching_accounts' | 'select_accounts' | 'saving' | 'error'

export function BrokerCallback() {
  const S = useS()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const user = useAuthStore(s => s.user)
  const { upsertConnection, patchConnection } = useBrokerConnectionsStore()
  const addTrade = useTradesStore(s => s.addTrade)

  const [status, setStatus]   = useState<Status>('verifying')
  const [errMsg, setErrMsg]   = useState<string | null>(null)
  const [tokens, setTokens]   = useState<TradovateTokenResponse | null>(null)
  const [accounts, setAccounts] = useState<TradovateAccount[]>([])
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const error = params.get('error')
    if (error) {
      toast.message(S.brokers.cancelledToast)
      navigate('/brokers', { replace: true })
      return
    }

    const code  = params.get('code')
    const state = params.get('state')
    const savedState = window.localStorage.getItem(TRADOVATE_OAUTH_STATE_KEY)
    window.localStorage.removeItem(TRADOVATE_OAUTH_STATE_KEY)

    if (!code) {
      setStatus('error')
      setErrMsg(S.brokers.invalidCodeError)
      return
    }
    if (!savedState || savedState !== state) {
      setStatus('error')
      setErrMsg(S.brokers.invalidStateError)
      return
    }

    runFlow(code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runFlow = async (code: string) => {
    try {
      const tk = await exchangeCode({ code })
      setTokens(tk)
      setStatus('fetching_accounts')

      const list = await listAccounts(tk.accessToken)
      setAccounts(list)
      setStatus('select_accounts')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatus('error')
      setErrMsg(msg.includes('account') ? S.brokers.accountsFetchFailed : S.brokers.exchangeFailed)
    }
  }

  const handleConfirm = async (selected: TradovateAccount[]) => {
    if (!tokens || !user) return
    setStatus('saving')

    const inserted: BrokerConnection[] = []
    try {
      for (const a of selected) {
        const isDemo = (a.legalStatus ?? '').toLowerCase().includes('demo')
        const accountIdRaw = String(a.id)
        const accountIdKey = isDemo ? `demo_${accountIdRaw}` : accountIdRaw

        const { data, error } = await supabase
          .from('broker_connections')
          .upsert({
            user_id:          user.id,
            broker:           'tradovate',
            account_id:       accountIdKey,
            account_label:    a.nickname || a.name,
            is_demo:          isDemo,
            access_token:     tokens.accessToken,
            refresh_token:    tokens.accessToken, // Tradovate access tokenı kendisi refresh için kullanılır (renewaccesstoken).
            token_expires_at: tokens.expirationTime,
            last_sync_status: null,
            last_sync_error:  null,
          }, { onConflict: 'user_id,broker,account_id' })
          .select()
          .single()

        if (error) throw error
        if (data) {
          const conn = data as BrokerConnection
          upsertConnection(conn)
          inserted.push(conn)
        }
      }

      // İlk senkron — paralel değil, sıralı, hatalarda durmaz.
      for (const conn of inserted) {
        try {
          await syncTradovateConnection(conn, user.id, addTrade, patchConnection)
        } catch (err) {
          console.error(`Initial sync failed for ${conn.account_id}:`, err)
        }
      }

      toast.success(S.brokers.statusActive)
      navigate('/brokers', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatus('error')
      setErrMsg(msg)
    }
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-400/30 dark:bg-rose-500/10">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600 dark:text-rose-300" />
          <p className="mt-3 text-sm font-medium text-rose-700 dark:text-rose-200">
            {errMsg ?? S.brokers.exchangeFailed}
          </p>
          <button
            onClick={() => navigate('/brokers', { replace: true })}
            className="mt-4 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-400/40 dark:bg-transparent dark:text-rose-200 dark:hover:bg-rose-500/15"
          >
            {S.brokers.cancelButton}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#415dff] dark:text-[#8a9eff]" />
        <p className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
          {S.brokers.connectingTitle}
        </p>
        <p className="mt-1 text-xs text-gray-500 dark:text-[#9ca3af]">
          {S.brokers.connectingHint}
        </p>
      </div>

      <AccountSelectModal
        open={status === 'select_accounts'}
        onOpenChange={open => {
          if (!open) navigate('/brokers', { replace: true })
        }}
        accounts={accounts}
        loading={status === 'saving'}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
