import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'

/**
 * Hassas eylemler için audit log yazıcı.
 * - actor_id otomatik oturumdan
 * - INSERT-only (RLS), DB tarafında immutable
 * - Hata fail-silent: log yazımı UX'i kırmasın
 */
export async function audit(
  action: string,
  opts: { targetId?: string; targetType?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  try {
    const user = useAuthStore.getState().user
    if (!user) return
    await supabase.from('audit_logs').insert({
      actor_id:    user.id,
      action,
      target_id:   opts.targetId   ?? null,
      target_type: opts.targetType ?? null,
      metadata:    opts.metadata   ?? null,
    })
  } catch {
    // Yutuluyor — log telemetrik veri, kullanıcı akışını kırmasın
  }
}
