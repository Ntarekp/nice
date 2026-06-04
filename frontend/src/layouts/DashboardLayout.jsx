import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', roles: ['admin', 'inspector', 'user'] },
  { to: '/extinguishers', icon: '🧯', label: 'Extinguishers', roles: ['admin', 'inspector', 'user'] },
  { to: '/inspections', icon: '🔍', label: 'Inspections', roles: ['admin', 'inspector', 'user'] },
  { to: '/maintenance', icon: '🔧', label: 'Maintenance', roles: ['admin', 'inspector'] },
  { to: '/reports', icon: '📄', label: 'Reports', roles: ['admin', 'inspector'] },
  { to: '/users', icon: '👥', label: 'Users', roles: ['admin'] },
]

export default function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await api.post('/api/auth/logout') } catch {}
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  return (
    <div style={styles.shell}>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1d27', color: '#f0f0f0', border: '1px solid rgba(255,255,255,0.1)' }
      }} />

      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={{ fontSize: '1.5rem' }}>🔥</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1 }}>TWZ Fire</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>Safety System</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {NAV.filter(n => n.roles.includes(user?.role)).map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              ...styles.navItem,
              background: isActive ? 'rgba(192,57,43,0.15)' : 'transparent',
              color: isActive ? '#e74c3c' : 'var(--color-text-muted)',
              borderLeft: isActive ? '3px solid #e74c3c' : '3px solid transparent'
            })}>
              <span style={{ fontSize: '1.1rem' }}>{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarUser}>
          <div style={styles.avatar}>{user?.firstName?.[0]}{user?.lastName?.[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, truncate: 'ellipsis' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
          <button onClick={handleLogout} title="Logout" style={{
            background: 'none', padding: '0.3rem', fontSize: '1rem',
            color: 'var(--color-text-dim)', cursor: 'pointer'
          }}>⏻</button>
        </div>
      </aside>

      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}

const styles = {
  shell: { display: 'flex', height: '100vh', overflow: 'hidden' },
  sidebar: {
    width: '220px', background: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border)',
    display: 'flex', flexDirection: 'column', flexShrink: 0
  },
  sidebarLogo: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '1.2rem 1rem', borderBottom: '1px solid var(--color-border)'
  },
  nav: { flex: 1, padding: '0.75rem 0', overflow: 'auto' },
  navItem: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.65rem 1rem', fontSize: '0.875rem', fontWeight: 500,
    transition: 'all 0.15s', textDecoration: 'none'
  },
  sidebarUser: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '1rem', borderTop: '1px solid var(--color-border)'
  },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    background: 'var(--color-primary)', color: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
  },
  main: { flex: 1, overflow: 'auto', background: 'var(--color-bg)', padding: '1.5rem' }
}
