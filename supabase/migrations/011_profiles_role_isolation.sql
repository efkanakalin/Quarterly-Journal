-- ============================================================
-- 011: Profiles.role kolonunu non-admin'lerden gizle
--
-- Sorun: "Profiles readable by authenticated" policy'si tüm authenticated
-- kullanıcılara TÜM kolonları (role dahil) gösteriyor. Saldırgan açısından:
--   - Admin'in kim olduğu görünüyor → social engineering / targeted phishing
--   - Privilege escalation denemesi için kimi hedef alacağı belli
--
-- Çözüm: Column-level GRANT'ler ile role kolonunu authenticated'tan REVOKE et.
-- Kendi rolünü öğrenmek için SECURITY DEFINER fonksiyon (`get_my_role`).
-- ============================================================

-- ── Kendi role'ünü öğrenmek için RPC ──────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- ── role kolonunu authenticated'tan REVOKE et ─────────────
-- Postgres column-level grants: tablo-level GRANT ALL varsa column-level
-- REVOKE'i bypass eder. Bu yüzden önce tablo-level GRANT'i çekeceğiz, sonra
-- güvenli kolonları tek tek tanıyacağız.
REVOKE ALL    ON TABLE profiles FROM authenticated;
GRANT  SELECT (id, username, display_name, created_at, updated_at)
              ON profiles TO authenticated;
GRANT  INSERT, UPDATE, DELETE ON profiles TO authenticated;

-- INSERT/UPDATE'te tüm kolonları yazmaya devam edebilmeli (kendi satırı için).
-- RLS zaten kim ne yapabilir diye kontrol ediyor; column-level INSERT/UPDATE
-- explicit verilmediğinde Postgres tüm kolonlara izin verir (PostgreSQL spec).
-- Yine de net olsun diye explicit yazalım:
GRANT INSERT (id, username, display_name)         ON profiles TO authenticated;
GRANT UPDATE (display_name, username, updated_at) ON profiles TO authenticated;
-- NOT: role kolonu UPDATE'i kasıtlı olarak yok — protect_profile_role trigger
-- (008) zaten yakalıyor ama defense-in-depth olarak burada da reddediyoruz.
