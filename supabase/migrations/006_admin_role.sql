-- ============================================================
-- 006: Admin role + read-only journal access
--
-- Tek admin: efkanakalin1@gmail.com (tek ben). Odin hocam henüz kayıtlı
-- değil; o kayıt olduğunda manuel UPDATE ile admin yapılacak.
--
-- Admin sadece OKUYABİLİR — INSERT/UPDATE/DELETE diğer kullanıcıların
-- verisinde KAPALI. Broker token kolonları (broker_connections) admin'e
-- de KAPALI tutulur (token sızıntısı önlemek için politika değişmiyor).
-- ============================================================

-- ── Role enum + profiles.role ─────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user';

-- ── Admin atama (mail eşleşirse) ──────────────────────────
-- auth.users'tan email ile id bul, profile'ı admin yap.
UPDATE profiles
   SET role = 'admin'
 WHERE id = (SELECT id FROM auth.users WHERE email = 'efkanakalin1@gmail.com');

-- ── is_admin() helper ─────────────────────────────────────
-- SECURITY DEFINER: profiles RLS recursion'ını atlatır; STABLE: aynı
-- session'da cache'lenebilir.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ── trades: FOR ALL → ayrı SELECT + write policy'leri ─────
-- Eski "FOR ALL" politikası INSERT/UPDATE/DELETE'i de kapsıyordu.
-- Admin sadece SELECT'te yetkilensin diye policy'leri ayırıyoruz.
DROP POLICY IF EXISTS "Users see only their trades" ON trades;

CREATE POLICY "trades_select_own_or_admin"
  ON trades FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "trades_insert_own"
  ON trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_update_own"
  ON trades FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trades_delete_own"
  ON trades FOR DELETE
  USING (auth.uid() = user_id);

-- ── trade_confirmations: aynı ayrım ───────────────────────
DROP POLICY IF EXISTS "Users see only their confirmations" ON trade_confirmations;

CREATE POLICY "trade_confirmations_select_own_or_admin"
  ON trade_confirmations FOR SELECT
  USING (
    trade_id IN (
      SELECT id FROM trades
       WHERE user_id = auth.uid() OR public.is_admin()
    )
  );

CREATE POLICY "trade_confirmations_insert_own"
  ON trade_confirmations FOR INSERT
  WITH CHECK (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

CREATE POLICY "trade_confirmations_delete_own"
  ON trade_confirmations FOR DELETE
  USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

-- ── trade_mistakes: aynı ayrım ────────────────────────────
DROP POLICY IF EXISTS "Users see only their mistakes" ON trade_mistakes;

CREATE POLICY "trade_mistakes_select_own_or_admin"
  ON trade_mistakes FOR SELECT
  USING (
    trade_id IN (
      SELECT id FROM trades
       WHERE user_id = auth.uid() OR public.is_admin()
    )
  );

CREATE POLICY "trade_mistakes_insert_own"
  ON trade_mistakes FOR INSERT
  WITH CHECK (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

CREATE POLICY "trade_mistakes_delete_own"
  ON trade_mistakes FOR DELETE
  USING (trade_id IN (SELECT id FROM trades WHERE user_id = auth.uid()));

-- profiles: SELECT zaten "authenticated" tüm satırları okuyabiliyor
-- (ScoreBoard için). Admin için ayrıca bir şey değiştirmek gerekmez.
--
-- broker_connections: kasten dokunmuyoruz. Admin token'ları okuyamaz.
