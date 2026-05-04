import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ChevronRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useViewerStore } from '@/stores/useViewerStore'
import { useTradesStore } from '@/stores/useTradesStore'
import { useS } from '@/lib/i18n'
import { audit } from '@/lib/security/audit'

interface ProfileRow {
  id:           string
  username:     string
  display_name: string | null
  role:         'user' | 'admin'
  created_at:   string
}

export function AdminUsers() {
  const S = useS()
  const navigate = useNavigate()
  const role  = useAuthStore(s => s.role)
  const me    = useAuthStore(s => s.user)
  const setViewing  = useViewerStore(s => s.setViewing)
  const fetchTrades = useTradesStore(s => s.fetchTrades)
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (role !== 'admin') return
    let cancelled = false
    // Migration 011: profiles.role kolonu authenticated SELECT'ten revoke;
    // admin için SECURITY DEFINER RPC kullanıyoruz (admin guard içinde).
    void supabase
      .rpc('admin_list_profiles')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          toast.error(error.message)
          setLoading(false)
          return
        }
        setProfiles((data ?? []) as ProfileRow[])
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [role])

  if (role !== 'admin') {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-400/30 dark:bg-rose-400/10 dark:text-rose-200">
        {S.admin.unauthorized}
      </div>
    )
  }

  const handlePick = async (p: ProfileRow) => {
    if (p.id === me?.id) {
      toast.message(S.admin.cantViewSelf)
      return
    }
    setViewing(p.id, p.display_name || p.username)
    // Audit: admin başka kullanıcının journal'ını görüntüledi (immutable log)
    void audit('admin.view_user', {
      targetId:   p.id,
      targetType: 'profile',
      metadata:   { username: p.username },
    })
    await fetchTrades()
    navigate('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-amber-500" />
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{S.admin.title}</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-[#9ca3af]">{S.admin.subtitle}</p>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9ca3af]">
          <span className="inline-flex items-center gap-2"><Users className="h-3.5 w-3.5" />{S.admin.usersHeading}</span>
        </h2>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-[#9ca3af]">{S.admin.noUsers}</p>
        ) : (
          <ul className="space-y-2">
            {profiles.map(p => {
              const isSelf = p.id === me?.id
              return (
                <li key={p.id}>
                  <button
                    onClick={() => handlePick(p)}
                    disabled={isSelf}
                    className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                      isSelf
                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed dark:border-white/10 dark:bg-white/5'
                        : 'border-gray-200 bg-white hover:border-[#415dff]/40 hover:bg-[#415dff]/5 dark:border-white/10 dark:bg-[#1a1a1a] dark:hover:border-[#415dff]/40 dark:hover:bg-[#415dff]/5'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {p.display_name || p.username}
                        </p>
                        {p.role === 'admin' && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                            {S.admin.adminBadge}
                          </span>
                        )}
                        {isSelf && (
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-white/10 dark:text-[#9ca3af]">
                            {S.admin.youBadge}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-[#9ca3af]">
                        @{p.username}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-[#6b7280]">
                        {S.admin.joined} {new Date(p.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!isSelf && (
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-500 dark:text-[#3a3a3a] dark:group-hover:text-[#9ca3af]" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
