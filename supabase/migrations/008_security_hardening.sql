-- ============================================================
-- 008: Security hardening
--
-- 1. profiles.role privilege escalation FIX (CRITICAL):
--    Mevcut "Users update own profile" policy'sinde WITH CHECK yok.
--    Bir user kendi satırını UPDATE'lerken `role` kolonunu da değiştirebiliyor.
--    Sömürü: `UPDATE profiles SET role='admin' WHERE id=auth.uid()` →
--    user kendi kendine admin olur, sonra is_admin() ile başka kullanıcıların
--    trade/confirmation/mistake satırlarını okur.
--    DEFENSE: BEFORE UPDATE trigger ile role değişimini sadece is_admin()'e izin ver.
--
-- 2. broker_connections policy ayrımı:
--    Mevcut "FOR ALL" policy admin'in token okumasını kasten engelliyor (zaten
--    is_admin() check'i yok), ama policy'yi explicit hale getirip her komut
--    için ayrı tutmak daha açık.
-- ============================================================

-- ── 1. role kolonunu trigger ile koru ─────────────────────
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sadece role değişiyorsa kontrol et
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- is_admin() SECURITY DEFINER + STABLE → recursion safe
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'role kolonu yalnızca admin tarafından değiştirilebilir';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_role ON profiles;
CREATE TRIGGER profiles_protect_role
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- ── 2. profiles UPDATE policy'ye WITH CHECK ekle ──────────
-- Böylece user başka birinin id'sine de yazamaz (zaten USING var ama defense-in-depth)
DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING      (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── 3. broker_connections: explicit policy ayrımı ─────────
-- Eski "FOR ALL" policy admin'in token okumasını engelliyordu (is_admin yok),
-- ama policy'yi açıkça komut bazlı tutmak daha okunaklı + ileride admin
-- READ eklenirse token'ları kasten dışarıda tutabilelim.
DROP POLICY IF EXISTS "Users see only their connections" ON broker_connections;

CREATE POLICY "broker_conn_select_own"
  ON broker_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "broker_conn_insert_own"
  ON broker_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "broker_conn_update_own"
  ON broker_connections FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "broker_conn_delete_own"
  ON broker_connections FOR DELETE
  USING (auth.uid() = user_id);

-- ── 4. profiles INSERT policy'ye id check ekle ────────────
-- Mevcutta WITH CHECK (auth.uid() = id) var, OK. Sadece doğrula:
-- (no-op DROP/CREATE — zaten doğru, ama 002'deki tanımı korumak için ekleme yapmıyoruz)

-- Notlar:
-- - is_admin() public.is_admin() olarak tanımlı (006)
-- - trigger SECURITY DEFINER → public.is_admin() çağrısı RLS bypass ile çalışır
-- - role escalation kapatıldı; mevcut admin (the account set in 006_admin_role.sql) etkilenmez
