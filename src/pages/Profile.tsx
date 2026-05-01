import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import { AtSign, Mail, CalendarDays, User as UserIcon, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/useAuthStore'
import { useLangStore } from '@/stores/useLangStore'
import { useS } from '@/lib/i18n'
import { CustomizationSection } from '@/components/profile/CustomizationSection'

interface ProfileData {
  username:     string
  display_name: string | null
  created_at:   string
}

export function Profile() {
  const S = useS()
  const lang = useLangStore(s => s.lang)
  const locale = lang === 'tr' ? tr : enUS
  const user = useAuthStore(s => s.user)
  const role = useAuthStore(s => s.role)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('username, display_name, created_at')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as ProfileData)
        setLoading(false)
      })
  }, [user])

  if (loading) {
    return <div className="h-48 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
  }

  if (!profile) {
    return <p className="text-gray-500 dark:text-[#9ca3af]">—</p>
  }

  const joined = profile.created_at
    ? format(new Date(profile.created_at), 'd MMMM yyyy', { locale })
    : '—'

  const initial = (profile.display_name || profile.username || '?').charAt(0).toUpperCase()

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Avatar card */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] p-5 sm:p-8">
        <div className="flex items-center gap-4 sm:gap-5">
          <div
            className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full text-2xl sm:text-3xl font-bold text-white shadow-sm shrink-0"
            style={{ backgroundColor: '#415dff' }}
          >
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm text-gray-500 dark:text-[#9ca3af] truncate">
              @{profile.username}
            </p>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {S.profile.accountInfo}
          </h2>
        </div>

        <InfoRow
          icon={<AtSign className="h-4 w-4" />}
          label={S.profile.username}
          value={profile.username}
          hint={S.profile.usernameLockedHint}
        />
        <InfoRow
          icon={<UserIcon className="h-4 w-4" />}
          label={S.profile.displayName}
          value={profile.display_name || '—'}
        />
        <InfoRow
          icon={<Mail className="h-4 w-4" />}
          label={S.profile.email}
          value={user?.email ?? '—'}
        />
        <InfoRow
          icon={<CalendarDays className="h-4 w-4" />}
          label={S.profile.joined}
          value={joined}
        />
        {/* Geçici debug: rol değeri görünüyorsa frontend doğru çalışıyor demektir. */}
        <InfoRow
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Role (debug)"
          value={role ?? '(loading…)'}
          last
        />
      </div>

      {/* Admin shortcut — yalnız role=admin için görünür */}
      {role === 'admin' && (
        <Link
          to="/admin"
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 sm:px-6 py-4 transition-colors hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:hover:bg-amber-400/15"
        >
          <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{S.nav.admin}</p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-200/80">{S.admin.subtitle}</p>
          </div>
          <span className="text-xs font-medium text-amber-700 dark:text-amber-200">→</span>
        </Link>
      )}

      {/* Özelleştirme */}
      <CustomizationSection />
    </div>
  )
}

interface InfoRowProps {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  last?: boolean
}

function InfoRow({ icon, label, value, hint, last }: InfoRowProps) {
  return (
    <div className={`flex items-start gap-4 px-4 sm:px-6 py-4 ${last ? '' : 'border-b border-gray-100 dark:border-white/5'}`}>
      <div className="mt-0.5 text-gray-400 dark:text-[#6b7280] shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-500 dark:text-[#9ca3af]">{label}</p>
        <p className="mt-0.5 text-sm text-gray-900 dark:text-white truncate">{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-400 dark:text-[#6b7280]">{hint}</p>}
      </div>
    </div>
  )
}
