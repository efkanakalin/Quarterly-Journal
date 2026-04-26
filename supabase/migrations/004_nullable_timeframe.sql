-- Bazı confirmation tipleri (CVD, RSI vb.) timeframe'e bağlı değil.
-- timeframe kolonunu nullable yapıyoruz.

ALTER TABLE trade_confirmations
  ALTER COLUMN timeframe DROP NOT NULL;
