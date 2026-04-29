import { supabase } from '@/lib/supabase'
import { useBrokerConnectionsStore } from '@/stores/useBrokerConnectionsStore'
import { fetchFills, refreshAccessToken } from './tradovate'
import { groupFillsToTrades } from '@/lib/trades/groupFillsToTrades'
import type { BrokerConnection, TradeWithRelations } from '@/types'

interface SyncResult {
  imported: number
  skipped:  number
}

/**
 * Bir Tradovate bağlantısı için senkronizasyon çalıştırır:
 *  1. Token süresi 5 dk içinde dolacaksa proaktif yenile.
 *  2. Tarih aralığı belirle: ilk senkron → son 30 gün; sonrası → last_synced_at - 1 saat (overlap buffer).
 *  3. Worker üzerinden fill+contract çek.
 *  4. groupFillsToTrades ile fill'leri trade'lere dönüştür.
 *  5. Her trade'i `trades` tablosuna insert et (csv_fingerprint duplicate detection ile).
 *  6. broker_connections satırını last_synced_at + status ile güncelle.
 */
export async function syncTradovateConnection(
  connection: BrokerConnection,
  userId:     string,
  addTrade:   (trade: TradeWithRelations) => void,
  patchConnection: (id: string, patch: Partial<BrokerConnection>) => void,
): Promise<SyncResult> {
  let { access_token, refresh_token, token_expires_at } = connection
  if (!access_token || !refresh_token) {
    throw new Error('Connection has no Tradovate access token')
  }

  // 1) Token expiry kontrolü — 5 dk threshold.
  // Tradovate'te ayrı refresh token yoktur: /renewaccesstoken mevcut access
  // token ile çağrılır ve yeni access token döner. Bu nedenle yenileme sonrası
  // hem access_token hem refresh_token kolonu YENİ token olarak güncellenir;
  // bir sonraki yenileme bu yeni token üstünden gider.
  const expiresAt = token_expires_at ? new Date(token_expires_at).getTime() : 0
  const fiveMinFromNow = Date.now() + 5 * 60 * 1000
  if (!token_expires_at || expiresAt <= fiveMinFromNow) {
    try {
      const refreshed = await refreshAccessToken(refresh_token)
      access_token      = refreshed.accessToken
      refresh_token     = refreshed.accessToken
      token_expires_at  = refreshed.expirationTime
      const upd = await persistTokens(connection.id, refreshed.accessToken, refreshed.accessToken, refreshed.expirationTime)
      patchConnection(connection.id, upd)
    } catch {
      const failed = await markConnection(connection.id, {
        last_sync_status: 'token_expired',
        last_sync_error:  'Refresh token expired or invalid.',
      })
      patchConnection(connection.id, failed)
      throw new Error('Tradovate token expired. Please reconnect.')
    }
  }

  // 2) Tarih aralığı.
  const to = new Date()
  let from: Date
  if (connection.last_synced_at) {
    from = new Date(new Date(connection.last_synced_at).getTime() - 60 * 60 * 1000)
  } else {
    from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)
  }

  // 3) Fill'leri çek.
  let payload
  try {
    payload = await fetchFills({
      tradovateAccessToken: access_token!,
      accountId:            connection.account_id.replace(/^demo_/, ''),
      from:                 from.toISOString(),
      to:                   to.toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const failed = await markConnection(connection.id, {
      last_sync_status: 'failed',
      last_sync_error:  msg,
    })
    patchConnection(connection.id, failed)
    throw err
  }

  // 4) Group fills → trade payloads.
  const tradeInputs = groupFillsToTrades(payload.fills, payload.contracts)

  // 5) Insert.
  let imported = 0
  let skipped  = 0
  for (const t of tradeInputs) {
    const { data, error } = await supabase
      .from('trades')
      .insert({ ...t, user_id: userId })
      .select()
      .single()
    if (error) {
      if (error.code === '23505') { skipped++; continue }
      console.error(error)
      continue
    }
    if (data) {
      addTrade({ ...data, trade_confirmations: [], trade_mistakes: [] } as TradeWithRelations)
      imported++
    }
  }

  // 6) Status güncelle.
  const ok = await markConnection(connection.id, {
    last_synced_at:   to.toISOString(),
    last_sync_status: 'success',
    last_sync_error:  null,
  })
  patchConnection(connection.id, ok)

  return { imported, skipped }
}

async function persistTokens(
  id: string,
  access:  string,
  refresh: string,
  expiry:  string,
): Promise<Partial<BrokerConnection>> {
  const patch = {
    access_token:     access,
    refresh_token:    refresh,
    token_expires_at: expiry,
  }
  const { error } = await supabase.from('broker_connections').update(patch).eq('id', id)
  if (error) throw error
  return patch
}

async function markConnection(id: string, patch: Partial<BrokerConnection>): Promise<Partial<BrokerConnection>> {
  const { error } = await supabase.from('broker_connections').update(patch).eq('id', id)
  if (error) console.error(error)
  return patch
}

/**
 * Bütün aktif Tradovate bağlantıları için sırayla senkron çalıştırır
 * (örn. ilk bağlanmadan sonra). Hatalarda durmaz, devam eder.
 */
export async function syncAllConnections(
  userId: string,
  addTrade: (trade: TradeWithRelations) => void,
): Promise<SyncResult> {
  const store = useBrokerConnectionsStore.getState()
  const totals: SyncResult = { imported: 0, skipped: 0 }
  for (const c of store.connections) {
    if (c.broker !== 'tradovate') continue
    try {
      const r = await syncTradovateConnection(c, userId, addTrade, store.patchConnection)
      totals.imported += r.imported
      totals.skipped  += r.skipped
    } catch (err) {
      console.error(`Sync failed for ${c.account_id}:`, err)
    }
  }
  return totals
}
