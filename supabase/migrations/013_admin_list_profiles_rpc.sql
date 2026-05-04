-- ============================================================
-- 013: admin_list_profiles() RPC
--
-- Migration 011 ile profiles.role kolonu authenticated rolüne kapatıldı.
-- Bu sebeple AdminUsers sayfası "permission denied" alıyordu çünkü
-- role kolonunu da SELECT etmeye çalışıyor.
--
-- Çözüm: SECURITY DEFINER fonksiyon — içinde is_admin() guard'ı.
-- Sadece admin'ler tüm profiles satırlarını role ile birlikte alır.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS TABLE (
  id           uuid,
  username     text,
  display_name text,
  role         user_role,
  created_at   timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;
  RETURN QUERY
    SELECT p.id, p.username, p.display_name, p.role, p.created_at
      FROM profiles p
     ORDER BY p.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
