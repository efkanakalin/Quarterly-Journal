-- ============================================================
-- 012: Audit log retention (90 gün)
--
-- audit_logs sınırsız büyür ve eski kayıtlar genelde değersizdir.
-- 90 günden eski kayıtları silen function + (opsiyonel) pg_cron schedule.
--
-- KURULUM:
--   Bu migration'ı çalıştır. pg_cron ekstensiyonu Supabase'te varsa schedule
--   otomatik aktive olur. Yoksa fonksiyonu manuel veya bir başka scheduler
--   ile (Cloudflare Cron Trigger, GitHub Actions cron vb.) çağır.
-- ============================================================

-- ── Cleanup fonksiyonu ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(
  retention_days int DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count int;
BEGIN
  WITH d AS (
    DELETE FROM audit_logs
     WHERE created_at < now() - make_interval(days => retention_days)
    RETURNING 1
  )
  SELECT count(*) INTO deleted_count FROM d;
  RETURN deleted_count;
END;
$$;

-- Sadece admin'in elle çağırabilmesi için
REVOKE ALL ON FUNCTION public.cleanup_old_audit_logs(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_audit_logs(int) FROM authenticated;

-- ── pg_cron schedule (opsiyonel — extension varsa) ───────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('qt-cleanup-audit-logs')
      FROM cron.job WHERE jobname = 'qt-cleanup-audit-logs';

    PERFORM cron.schedule(
      'qt-cleanup-audit-logs',
      '0 3 * * *',                                 -- her gün 03:00 UTC
      $cron$ SELECT public.cleanup_old_audit_logs(90); $cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron yoksa veya schedule başarısız olursa migration kırılmasın
  RAISE NOTICE 'pg_cron schedule atlandı: %', SQLERRM;
END $$;
