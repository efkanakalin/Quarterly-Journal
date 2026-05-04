-- Extend contract_class to support forex and crypto symbols
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_contract_class_check;
ALTER TABLE trades ADD CONSTRAINT trades_contract_class_check
  CHECK (contract_class IN ('micro', 'mini', 'forex', 'crypto'));
