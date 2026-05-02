import { useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen, BarChart2, TrendingUp,
  User, LogOut, Sun, Moon, Newspaper, X, ShieldCheck, FileText, PanelLeftClose,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useLangStore } from '@/stores/useLangStore'
import { useNewsStore } from '@/stores/useNewsStore'
import { UnreadBadge } from '@/components/news/UnreadBadge'
import { useS } from '@/lib/i18n'

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
  desktopCollapsed?: boolean
  onDesktopToggle?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose, desktopCollapsed = false, onDesktopToggle }: SidebarProps) {
  const { signOut } = useAuthStore()
  const { theme, toggle: toggleTheme } = useThemeStore()
  const { lang, toggle: toggleLang } = useLangStore()
  const unreadNews = useNewsStore(s => s.unread)
  const navigate = useNavigate()
  const location = useLocation()
  const S = useS()
  const initialPath = useRef(location.pathname)

  // Route değişince mobil drawer'ı kapat (ilk mount'ta tetiklenmesin)
  useEffect(() => {
    if (location.pathname !== initialPath.current) {
      onMobileClose?.()
    }
  }, [location.pathname, onMobileClose])

  const role = useAuthStore(s => s.role)
  // Brokers sekmesi şu an gizli — Tradovate manuel-token akışı production'da
  // yeterince test edilmediği için kullanıcılara henüz açmıyoruz. Kod (sayfa,
  // store, worker entegrasyonu) repo'da duruyor; aşağıdaki satırı geri açmak
  // yeniden aktif etmek için yeterli.
  // { to: '/brokers',     icon: Plug,         label: S.nav.brokers, beta: true },
  const NAV_ITEMS = [
    { to: '/dashboard',   icon: BarChart2,  label: S.nav.dashboard },
    { to: '/journal',     icon: BookOpen,   label: S.nav.journal },
    { to: '/daily-stats', icon: TrendingUp, label: S.nav.dailyStats },
    { to: '/news',        icon: Newspaper,  label: S.nav.news, badge: unreadNews },
    { to: '/blog',        icon: FileText,   label: S.nav.blog },
    ...(role === 'admin'
      ? [{ to: '/admin', icon: ShieldCheck, label: S.nav.admin }]
      : []),
  ] as const

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Backdrop — mobilde drawer açıkken */}
      <div
        onClick={onMobileClose}
        className={`md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] transition-transform duration-200 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${desktopCollapsed ? 'md:-translate-x-full' : 'md:translate-x-0'}`}
      >
        {/* Mobile close button */}
        <button
          onClick={onMobileClose}
          aria-label="Menüyü kapat"
          className="md:hidden absolute right-2 top-2 rounded-lg p-2 text-gray-500 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center px-4 py-4 border-b border-gray-200 dark:border-white/10">
          <img
            src="/qt-wordmark.png"
            alt="Quarterly Journal"
            className="h-24 w-auto object-contain"
            onError={e => {
              const t = e.currentTarget
              t.style.display = 'none'
              t.nextElementSibling?.removeAttribute('style')
            }}
          />
          <span className="text-sm font-semibold text-gray-900 dark:text-white tracking-tight hidden">
            Quarterly Journal
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const badge = 'badge' in item ? (item as { badge?: number }).badge ?? 0 : 0
            const beta  = 'beta' in item ? Boolean((item as { beta?: boolean }).beta) : false
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#415dff]/10 text-[#415dff] dark:bg-[#415dff]/15 dark:text-[#8a9eff]'
                      : 'text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
                {beta && (
                  <span className="ml-auto rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
                    BETA
                  </span>
                )}
                {badge > 0 && <UnreadBadge count={badge} />}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 space-y-0.5 border-t border-gray-200 dark:border-white/10 pt-3">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <span className="text-base leading-none shrink-0">🌐</span>
            <span className="font-mono font-semibold text-xs tracking-wider">{lang.toUpperCase()}</span>
            <span className="ml-auto text-[11px] text-gray-400 dark:text-[#6b7280]">
              → {lang === 'tr' ? 'EN' : 'TR'}
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
                  ? 'bg-[#415dff]/10 text-[#415dff] dark:bg-[#415dff]/15 dark:text-[#8a9eff]'
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

          {/* Desktop collapse button */}
          {onDesktopToggle && (
            <button
              onClick={onDesktopToggle}
              aria-label="Sidebar'ı gizle"
              className="hidden md:flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-400 dark:text-[#6b7280] hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-[#9ca3af] transition-colors"
            >
              <PanelLeftClose className="h-4 w-4 shrink-0" />
              <span className="text-xs">{S.nav.hideSidebar}</span>
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
