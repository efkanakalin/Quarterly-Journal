-- CR-16: Trades tablosuna currency kolonu ekle
ALTER TABLE trades ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
