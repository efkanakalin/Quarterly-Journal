import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Toaster } from '@/components/ui/sonner'

export function Layout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main className="mx-auto max-w-screen-xl px-6 py-6">
        <Outlet />
      </main>
      <Toaster theme="dark" />
    </div>
  )
}
