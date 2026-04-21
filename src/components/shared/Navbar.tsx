import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { LogOut, BarChart2, BookOpen } from 'lucide-react'

export function Navbar() {
  const { user, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-6">
        {/* Logo */}
        <span className="text-lg font-bold tracking-tight text-white">
          QT Journal
        </span>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-[#9ca3af] hover:text-white'
              }`
            }
          >
            <BarChart2 className="h-4 w-4" />
            Dashboard
          </NavLink>

          <NavLink
            to="/journal"
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-[#9ca3af] hover:text-white'
              }`
            }
          >
            <BookOpen className="h-4 w-4" />
            Journal
          </NavLink>
        </nav>

        {/* User menu */}
        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="hidden text-xs text-[#9ca3af] sm:inline">
              {user.email}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-8 w-8 text-[#9ca3af] hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
