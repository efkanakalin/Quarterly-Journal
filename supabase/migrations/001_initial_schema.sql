-- QT Journal — Initial Schema
-- Sprint 1: Create tables + RLS policies

-- ============================================================
-- TABLE: trades
-- ============================================================
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  -- CSV-derived fields
  symbol_raw TEXT,
  symbol TEXT,
  contract_class TEXT CHECK (contract_class IN ('micro', 'mini')),
  direction TEXT CHECK (direction IN ('long', 'short')),
  qty INTEGER,
  entry_price DECIMAL,
  exit_price DECIMAL,
  entry_time_et TIMESTAMPTZ,
  exit_time_et TIMESTAMPTZ,
  pnl_usd DECIMAL,
  duration_sec INTEGER,

  -- Auto-derived fields
  session TEXT CHECK (session IN ('asia', 'london', 'ny_am', 'ny_pm')),
  day_of_week INTEGER,
  session_quarter TEXT CHECK (session_quarter IN ('Q1', 'Q2', 'Q3', 'Q4')),
  micro_quarter_90m TEXT CHECK (micro_quarter_90m IN ('Q1', 'Q2', 'Q3', 'Q4')),
  week_of_year INTEGER,
  month_quarter TEXT,
  year_quarter TEXT,
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'breakeven')),

  -- Manual fields
  r_multiple DECIMAL,
  chart_link TEXT,
  notes TEXT,

  -- Meta
  source TEXT DEFAULT 'csv' CHECK (source IN ('csv', 'manual')),
  is_complete BOOLEAN DEFAULT FALSE,
  csv_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Prevent duplicate imports (same trade uploaded twice)
CREATE UNIQUE INDEX idx_trades_fingerprint
  ON trades(user_id, csv_fingerprint)
  WHERE csv_fingerprint IS NOT NULL;

CREATE INDEX idx_trades_user_entry ON trades(user_id, entry_time_et DESC);

-- ============================================================
-- TABLE: trade_confirmations
-- ============================================================
CREATE TABLE trade_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  confirmation_type TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_confirmations_trade ON trade_confirmations(trade_id);

-- ============================================================
-- TABLE: trade_mistakes
-- ============================================================
CREATE TABLE trade_mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID REFERENCES trades(id) ON DELETE CASCADE NOT NULL,
  mistake_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_mistakes_trade ON trade_mistakes(trade_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see only their trades"
  ON trades FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE trade_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see only their confirmations"
  ON trade_confirmations FOR ALL
  USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

ALTER TABLE trade_mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see only their mistakes"
  ON trade_mistakes FOR ALL
  USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
