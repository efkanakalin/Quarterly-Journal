-- ============================================================
-- 010: Tradovate token at-rest encryption (pgcrypto)
--
-- Defense-in-depth: RLS satır seviyesinde koruyor ama backup leak veya
-- yetkili erişim senaryolarında plaintext token'lar saldırgana gider.
-- pgcrypto ile vault'tan alınan key ile sym-encrypt yapıyoruz.
--
-- KURULUM (run order):
--   1) Bu migration'ı uygula
--   2) Vault'a key ekle (Supabase Dashboard → Vault):
--        SELECT vault.create_secret('TRADOVATE_TOKEN_KEY',
--          encode(gen_random_bytes(32), 'base64'));
--      (veya wrangler secret gibi sabit bir 32-byte base64 key)
--   3) Mevcut plaintext token'ları encrypt et (idempotent fonksiyon ile):
--        UPDATE broker_connections
--           SET access_token  = public.encrypt_token(access_token),
--               refresh_token = public.encrypt_token(refresh_token)
--         WHERE access_token IS NOT NULL
--           AND access_token NOT LIKE 'enc:%';
--
-- KULLANIM:
--   - YAZIM (insert/update): public.encrypt_token(plaintext) çağrılır
--   - OKUMA: public.decrypt_token(ciphertext) çağrılır
--   - encode prefix 'enc:' ile encrypted'i ayırt ediyoruz (geriye dönük uyumluluk)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ── Vault key okumak için yardımcı (SECURITY DEFINER) ─────
CREATE OR REPLACE FUNCTION public._get_token_key()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, extensions
AS $$
DECLARE
  k text;
BEGIN
  SELECT decrypted_secret INTO k
    FROM vault.decrypted_secrets
   WHERE name = 'TRADOVATE_TOKEN_KEY'
   LIMIT 1;
  IF k IS NULL THEN
    RAISE EXCEPTION 'TRADOVATE_TOKEN_KEY missing from vault — see migration 010 install notes';
  END IF;
  RETURN k;
END;
$$;
REVOKE ALL ON FUNCTION public._get_token_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION public._get_token_key() FROM authenticated;
REVOKE ALL ON FUNCTION public._get_token_key() FROM anon;

-- ── encrypt_token: plain → 'enc:<base64>' ────────────────
CREATE OR REPLACE FUNCTION public.encrypt_token(plain text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  k text;
BEGIN
  IF plain IS NULL OR length(plain) = 0 THEN RETURN plain; END IF;
  -- Idempotent: zaten encrypted ise pass-through
  IF plain LIKE 'enc:%' THEN RETURN plain; END IF;
  k := public._get_token_key();
  RETURN 'enc:' || encode(extensions.pgp_sym_encrypt(plain, k), 'base64');
END;
$$;

-- ── decrypt_token: 'enc:<base64>' → plain ────────────────
CREATE OR REPLACE FUNCTION public.decrypt_token(cipher text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  k text;
  payload bytea;
BEGIN
  IF cipher IS NULL OR length(cipher) = 0 THEN RETURN cipher; END IF;
  -- Geriye dönük uyumluluk: prefix yoksa eski plaintext token, olduğu gibi dön
  IF cipher NOT LIKE 'enc:%' THEN RETURN cipher; END IF;
  k := public._get_token_key();
  payload := decode(substring(cipher FROM 5), 'base64');
  RETURN extensions.pgp_sym_decrypt(payload, k);
END;
$$;

-- ── Trigger: INSERT/UPDATE'te access/refresh tokenları otomatik encrypt et ──
CREATE OR REPLACE FUNCTION public.broker_conn_encrypt_tokens()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.access_token IS NOT NULL THEN
    NEW.access_token := public.encrypt_token(NEW.access_token);
  END IF;
  IF NEW.refresh_token IS NOT NULL THEN
    NEW.refresh_token := public.encrypt_token(NEW.refresh_token);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS broker_conn_encrypt_tokens ON broker_connections;
CREATE TRIGGER broker_conn_encrypt_tokens
  BEFORE INSERT OR UPDATE OF access_token, refresh_token ON broker_connections
  FOR EACH ROW EXECUTE FUNCTION public.broker_conn_encrypt_tokens();

-- ── Authenticated user'a sadece decrypt fonksiyonu açık ───
-- (encrypt zaten trigger ile otomatik; user'ın elle çağırmasına gerek yok)
GRANT EXECUTE ON FUNCTION public.decrypt_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_token(text) TO authenticated;

-- Kullanım notu (frontend / worker):
--   broker_connections SELECT'inde access_token/refresh_token'lar 'enc:<base64>'
--   formatında dönecek. Frontend bunları kullanmadan önce
--   `supabase.rpc('decrypt_token', { cipher: ... })` ile çözüyor.
