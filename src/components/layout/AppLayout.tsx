import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, PanelLeftOpen } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { AdminViewBanner } from './AdminViewBanner'
import { Toaster } from '@/components/ui/sonner'
import { useNewsStore } from '@/stores/useNewsStore'
import { useSidebarStore } from '@/stores/useSidebarStore'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const startNews = useNewsStore(s => s.start)
  const { collapsed, toggle: toggleSidebar } = useSidebarStore()

  useEffect(() => {
    const stop = startNews()
    return stop
  }, [startNews])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <div className="min-h-screen overflow-x-clip bg-gray-100 dark:bg-[#0a0a0a]">
      {/* Mobile topbar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-3">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Menüyü aç"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className="rounded-lg p-2 text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img
          src="/qt-wordmark.png"
          alt="Quarterly Journal"
          className="h-9 w-auto object-contain"
        />
        <div className="w-9" />
      </header>

      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        desktopCollapsed={collapsed}
        onDesktopToggle={toggleSidebar}
      />

      {/* Re-open button (desktop, shown only when sidebar is collapsed) */}
      {collapsed && (
        <button
          onClick={toggleSidebar}
          aria-label="Sidebar'ı aç"
          className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-40 items-center justify-center h-10 w-6 rounded-r-lg border border-l-0 border-gray-200 dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-[#9ca3af] hover:text-gray-900 dark:hover:text-white shadow-sm transition-colors"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <main className={`min-h-screen transition-[margin] duration-200 ${collapsed ? 'md:ml-0' : 'md:ml-60'}`}>
        <AdminViewBanner />
        <div className="max-w-screen-2xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
          <Outlet />
        </div>
      </main>
      <Toaster theme="system" />
    </div>
  )
}
