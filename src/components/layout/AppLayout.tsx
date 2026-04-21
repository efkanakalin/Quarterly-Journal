import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/sonner'

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <Sidebar />
      <main className="ml-60 min-h-screen">
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
      <Toaster theme="system" />
    </div>
  )
}
