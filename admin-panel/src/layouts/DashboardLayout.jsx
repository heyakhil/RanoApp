import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Button,
  Sidebar,
  SidebarItem,
  SidebarItemGroup,
  SidebarItems,
} from 'flowbite-react'
import {
  LayoutDashboard,
  Users,
  CandlestickChart,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Wallet,
  ArrowDownToLine,
  Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/markets', label: 'Markets', icon: CandlestickChart },
  { to: '/dashboard/users', label: 'Users', icon: Users },
  { to: '/dashboard/recharge', label: 'Recharge', icon: Wallet },
  { to: '/dashboard/withdrawals', label: 'Withdraw', icon: ArrowDownToLine },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const isActive = (to, end = false) => {
    if (end) return location.pathname === to
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-gray-900/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-gray-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
              AP
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
              <p className="text-xs text-gray-500">Control Center</p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <Sidebar
          aria-label="Admin sidebar"
          className="h-[calc(100vh-4rem)] w-full rounded-none border-0 [&>div]:rounded-none [&>div]:bg-white"
        >
          <SidebarItems>
            <SidebarItemGroup>
              {navItems.map((item) => {
                const Icon = item.icon

                return (
                  <SidebarItem
                    key={item.to}
                    as={NavLink}
                    to={item.to}
                    end={item.end}
                    active={isActive(item.to, item.end)}
                    icon={Icon}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    {item.label}
                  </SidebarItem>
                )
              })}
            </SidebarItemGroup>

            <SidebarItemGroup>
              <SidebarItem icon={LogOut} onClick={handleLogout}>
                Sign out
              </SidebarItem>
            </SidebarItemGroup>
          </SidebarItems>
        </Sidebar>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 sm:flex">
                <Search className="h-4 w-4" />
                <span>Search...</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
              </button>

              <div className="hidden items-center gap-2 sm:flex">
                <Avatar rounded placeholderInitials={(user?.name || 'A').slice(0, 1)} />
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>

              <Button color="light" size="sm" onClick={handleLogout} className="hidden sm:inline-flex">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
