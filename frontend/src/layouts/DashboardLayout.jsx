import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'
import { NAV_ITEMS } from '../lib/navConfig'
import MaterialIcon from '../components/MaterialIcon'
import GlobalSearch from '../components/GlobalSearch'

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      /* ignore */
    }
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  const nav = NAV_ITEMS.filter((n) => n.roles.includes(user?.role))

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#172B4D',
            border: '1px solid #E8EDF3',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        }}
      />

      <nav className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-border-ice bg-surface-white p-4 shadow-md">
        <div className="mb-2 flex items-center gap-2 border-b border-border-ice px-2 py-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
            <MaterialIcon name="local_fire_department" size={22} fill className="text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-headline-sm font-bold text-primary">TWZ-LTD</h1>
            <p className="text-label-small text-text-secondary">Global Command Center</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto py-2">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-surface-container-high font-semibold text-primary'
                    : 'font-medium text-text-secondary hover:bg-surface-container-low hover:text-primary'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <MaterialIcon
                    name={icon}
                    size={22}
                    fill={isActive}
                    className={isActive ? 'text-primary' : 'text-text-secondary group-hover:text-primary'}
                  />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-border-ice pt-4">
          {(user?.role === 'user' || user?.role === 'inspector') && (
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary/90"
              onClick={() => navigate('/inspections')}
            >
              <MaterialIcon name="add" size={18} />
              New Inspection
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
            onClick={() => navigate('/profile')}
          >
            <MaterialIcon name="settings" size={22} />
            Settings
          </button>
        </div>
      </nav>

      <div className="ml-64 flex min-h-screen min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border-ice bg-surface-white/90 px-8 shadow-sm backdrop-blur-md">
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <span className="shrink-0 text-2xl font-extrabold text-primary">TWZ</span>
            <GlobalSearch />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
              title="Notifications"
              aria-label="Notifications"
            >
              <MaterialIcon name="notifications" size={22} />
            </button>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-container-low hover:text-primary"
              title="Profile"
              onClick={() => navigate('/profile')}
              aria-label="Profile"
            >
              <MaterialIcon name="settings" size={22} />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border-ice bg-primary-fixed text-xs font-bold text-primary transition-all hover:ring-2 hover:ring-primary/20"
              title={`${user?.firstName} ${user?.lastName} — sign out`}
              onClick={handleLogout}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </button>
          </div>
        </header>

        <main className="app-content mx-auto w-full max-w-container-max flex-1 px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
