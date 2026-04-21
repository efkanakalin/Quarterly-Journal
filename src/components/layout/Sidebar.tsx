import { NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen, BarChart2, TrendingUp, Trophy,
  User, LogOut, Sun, Moon,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useLangStore } from '@/stores/useLangStore'
import { useS } from '@/lib/i18n'

export function Sidebar() {
  const { signOut } = useAuthStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const { lang, toggle: toggleLang } = useLangStore()
  const navigate = useNavigate()
  const S = useS()

  const NAV_ITEMS = [
    { to: '/journal',     icon: BookOpen,   label: S.nav.journal },
    { to: '/dashboard',   icon: BarChart2,  label: S.nav.dashboard },
    { to: '/daily-stats', icon: TrendingUp, label: S.nav.dailyStats },
    { to: '/scoreboard',  icon: Trophy,     label: S.nav.scoreboard },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111]">
      {/* Logo */}
      <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-white/10">
        <img
          src="/logo.png"
          alt="QT Journal"
          className="h-9 w-auto object-contain"
          onError={e => {
            const t = e.currentTarget
            t.style.display = 'none'
            t.nextElementSibling?.removeAttribute('style')
          }}
        />
        <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight hidden">
          QT Journal
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-gray-200 dark:border-white/10 pt-3">
        {/* Language toggle */}
        <button
          onClick={toggleLang}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span className="text-base leading-none shrink-0">🌐</span>
          <span>{lang === 'en' ? 'Türkçe' : 'English'}</span>
          <span className="ml-auto text-xs text-gray-400 dark:text-[#6b7280] font-mono">
            {lang.toUpperCase()}
          </span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {theme === 'light'
            ? <Moon className="h-4 w-4 shrink-0" />
            : <Sun  className="h-4 w-4 shrink-0" />}
          {theme === 'light'
            ? (lang === 'en' ? 'Dark Mode' : 'Karanlık Mod')
            : (lang === 'en' ? 'Light Mode' : 'Aydınlık Mod')}
        </button>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
            }`
          }
        >
          <User className="h-4 w-4 shrink-0" />
          {S.nav.profile}
        </NavLink>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-[#9ca3af] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {S.nav.logout}
        </button>
      </div>
    </aside>
  )
}
