-- ============================================================
-- 009: Audit logs (admin actions tracking)
--
-- Adminin başka kullanıcının journal'ını görüntüleme, blog işlemleri,
-- ve diğer hassas eylemleri izlemek için. SADECE admin okuyabilir.
-- INSERT: tüm authenticated user'lar (kendi action'larını yazabilir).
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  target_id   UUID,
  target_type TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor      ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target     ON audit_logs(target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- INSERT: kendi action'ını ekleyebilir (actor_id = self)
DROP POLICY IF EXISTS audit_logs_insert_self ON audit_logs;
CREATE POLICY audit_logs_insert_self
  ON audit_logs FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- SELECT: SADECE admin
DROP POLICY IF EXISTS audit_logs_admin_select ON audit_logs;
CREATE POLICY audit_logs_admin_select
  ON audit_logs FOR SELECT
  USING (public.is_admin());

-- UPDATE/DELETE yok — log immutable.
