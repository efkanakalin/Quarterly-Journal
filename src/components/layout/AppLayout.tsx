import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { AdminViewBanner } from './AdminViewBanner'
import { Toaster } from '@/components/ui/sonner'
import { useNewsStore } from '@/stores/useNewsStore'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const startNews = useNewsStore(s => s.start)

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
    <div className="min-h-screen overflow-x-hidden bg-gray-100 dark:bg-[#0a0a0a]">
      {/* Mobile topbar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Menüyü aç"
          className="rounded-lg p-2 text-gray-600 dark:text-[#9ca3af] hover:bg-gray-100 dark:hover:bg-white/5 active:scale-95 transition"
        >
          <Menu className="h-5 w-5" />
        </button>
        <img
          src="/quarterly-journal.png"
          alt="Quarterly Journal"
          className="h-9 w-auto object-contain"
        />
        <div className="w-9" />
      </header>

      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <main className="md:ml-60 min-h-screen">
        <AdminViewBanner />
        <div className="max-w-screen-xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
          <Outlet />
        </div>
      </main>
      <Toaster theme="system" />
    </div>
  )
}
