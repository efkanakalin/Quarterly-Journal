-- CR-Batch-2: Broker auto-sync (Tradovate) için broker_connections tablosu.
-- Aynı zamanda trades.source enum'una 'tradovate_api' değerini ekler.

-- ============================================================
-- TRADES.SOURCE ENUM GENİŞLETMESİ
-- ============================================================
ALTER TABLE trades
  DROP CONSTRAINT IF EXISTS trades_source_check;

ALTER TABLE trades
  ADD CONSTRAINT trades_source_check
  CHECK (source IN ('csv', 'manual', 'tradovate_api'));

-- ============================================================
-- TABLE: broker_connections
-- ============================================================
CREATE TABLE broker_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  broker TEXT NOT NULL CHECK (broker IN ('tradovate', 'mt4', 'binance', 'ibkr')),
  account_id TEXT NOT NULL,
  account_label TEXT,
  is_demo BOOLEAN DEFAULT FALSE,

  -- OAuth tokenları. RLS koruyor; v2'de pgcrypto/Vault ile encryption yapılabilir.
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'failed', 'token_expired')),
  last_sync_error TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, broker, account_id)
);

CREATE INDEX idx_broker_connections_user
  ON broker_connections(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see only their connections"
  ON broker_connections FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE TRIGGER broker_connections_updated_at
  BEFORE UPDATE ON broker_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
