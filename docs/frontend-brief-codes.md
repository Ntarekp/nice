
## 🎨 Frontend React App

### `frontend/src/main.jsx`
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)
```

### `frontend/src/App.jsx`
```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth.store'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/Login'
import OtpPage from './pages/OtpVerify'
import ChangePasswordPage from './pages/ChangePassword'
import DashboardPage from './pages/Dashboard'
import ExtinguishersPage from './pages/Extinguishers'
import ExtinguisherDetailPage from './pages/ExtinguisherDetail'
import InspectionsPage from './pages/Inspections'
import MaintenancePage from './pages/Maintenance'
import ReportsPage from './pages/Reports'
import UsersPage from './pages/Users'
import ProfilePage from './pages/Profile'
import NotFoundPage from './pages/NotFound'

const ProtectedRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (user?.mustChangePassword) return <Navigate to="/change-password" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OtpPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="extinguishers" element={<ExtinguishersPage />} />
        <Route path="extinguishers/:id" element={<ExtinguisherDetailPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
```

### `frontend/src/stores/auth.store.js`
```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      pendingUserId: null,

      setLoginPending: (userId) => set({ pendingUserId: userId }),

      loginSuccess: (user, accessToken, refreshToken) =>
        set({ user, token: accessToken, refreshToken, pendingUserId: null }),

      updateUser: (updates) => set(s => ({ user: { ...s.user, ...updates } })),

      logout: () => {
        set({ user: null, token: null, refreshToken: null, pendingUserId: null })
        localStorage.removeItem('auth-storage')
      }
    }),
    { name: 'auth-storage', partialize: s => ({ user: s.user, token: s.token, refreshToken: s.refreshToken }) }
  )
)
```

### `frontend/src/lib/api.js`
```javascript
import axios from 'axios'
import { useAuthStore } from '../stores/auth.store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({ baseURL: API_URL, timeout: 15000 })

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => error ? prom.reject(error) : prom.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const { refreshToken, loginSuccess, user, logout } = useAuthStore.getState()
      if (!refreshToken) { logout(); return Promise.reject(err) }

      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken })
        loginSuccess(user, data.accessToken, data.refreshToken)
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (e) {
        processQueue(e, null)
        logout()
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)
```

### `frontend/src/index.css`
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --color-primary: #c0392b;
  --color-primary-dark: #962d22;
  --color-primary-light: #e74c3c;
  --color-bg: #0f1117;
  --color-surface: #1a1d27;
  --color-surface-2: #21253a;
  --color-border: rgba(255,255,255,0.08);
  --color-border-hover: rgba(255,255,255,0.15);
  --color-text: #f0f0f0;
  --color-text-muted: #8892a4;
  --color-text-dim: #505d73;
  --color-success: #27ae60;
  --color-warning: #f39c12;
  --color-danger: #e74c3c;
  --color-info: #3498db;
  --radius: 8px;
  --radius-lg: 12px;
  --shadow: 0 2px 8px rgba(0,0,0,0.4);
  --font: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 15px; }
body {
  font-family: var(--font);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--color-primary-light); text-decoration: none; }
button { font-family: var(--font); cursor: pointer; border: none; outline: none; }
input, select, textarea {
  font-family: var(--font);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  color: var(--color-text);
  padding: 0.6rem 0.9rem;
  font-size: 0.9rem;
  transition: border-color 0.2s;
  width: 100%;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(192,57,43,0.15);
}
input::placeholder { color: var(--color-text-dim); }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-bg); }
::-webkit-scrollbar-thumb { background: var(--color-surface-2); border-radius: 3px; }
```

### `frontend/src/pages/Login.jsx`
```jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setLoginPending } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      setLoginPending(data.userId)
      toast.success('OTP sent to your email')
      navigate('/otp', { state: { mustChangePassword: data.mustChangePassword } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.flame}>🔥</span>
          <div>
            <h1 style={styles.brand}>TWZ Fire Safety</h1>
            <p style={styles.tagline}>Equipment Management System</p>
          </div>
        </div>

        <h2 style={styles.title}>Sign in to your account</h2>
        <p style={styles.subtitle}>Enter your credentials to continue</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" required autoFocus
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
            />
          </div>
          <div style={{ textAlign: 'right', marginTop: '-0.5rem', marginBottom: '1rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#e74c3c' }}>
              Forgot password?
            </Link>
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Sending OTP...' : 'Continue with OTP →'}
          </button>
        </form>

        <p style={styles.notice}>
          🔐 A one-time password will be sent to your email for verification.
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f1117 0%, #1a1d27 50%, #0f1117 100%)',
    padding: '1rem'
  },
  card: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  },
  logo: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' },
  flame: { fontSize: '2.5rem' },
  brand: { fontSize: '1.3rem', fontWeight: 600, color: '#f0f0f0' },
  tagline: { fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' },
  title: { fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.3rem' },
  subtitle: { fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.8rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' },
  btn: {
    background: 'var(--color-primary)', color: 'white', padding: '0.8rem',
    borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.95rem',
    transition: 'background 0.2s', marginTop: '0.5rem'
  },
  notice: {
    marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-dim)',
    textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)',
    borderRadius: 'var(--radius)', border: '1px solid var(--color-border)'
  }
}
```

### `frontend/src/pages/OtpVerify.jsx`
```jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function OtpPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const refs = useRef([])
  const { pendingUserId, loginSuccess } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => { if (!pendingUserId) navigate('/login') }, [])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[i] = val
    setDigits(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      refs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const otp = digits.join('')
    if (otp.length !== 6) return toast.error('Enter all 6 digits')
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/verify-otp', { userId: pendingUserId, otp })
      loginSuccess(data.user, data.accessToken, data.refreshToken)
      toast.success('Welcome!')
      if (data.mustChangePassword || location.state?.mustChangePassword) {
        navigate('/change-password')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid OTP')
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>📧</div>
        <h2 style={styles.title}>Check your email</h2>
        <p style={styles.sub}>We sent a 6-digit code. It expires in 10 minutes.</p>

        <div style={styles.inputs} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input key={i} ref={el => refs.current[i] = el}
              type="text" inputMode="numeric" maxLength={1}
              value={d} onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{ ...styles.digit, borderColor: d ? 'var(--color-primary)' : 'var(--color-border)' }}
            />
          ))}
        </div>

        <button onClick={handleVerify} style={styles.btn} disabled={loading}>
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>
        <p style={styles.back} onClick={() => navigate('/login')}>← Back to login</p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--color-bg)', padding: '1rem'
  },
  card: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '380px',
    textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  },
  title: { fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' },
  sub: { color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' },
  inputs: { display: 'flex', gap: '0.7rem', justifyContent: 'center', marginBottom: '2rem' },
  digit: {
    width: '46px', height: '54px', textAlign: 'center', fontSize: '1.5rem',
    fontFamily: 'var(--font-mono)', fontWeight: 600, borderRadius: 'var(--radius)',
    border: '2px solid', transition: 'border-color 0.2s'
  },
  btn: {
    width: '100%', background: 'var(--color-primary)', color: 'white',
    padding: '0.8rem', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.95rem'
  },
  back: { marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', cursor: 'pointer' }
}
```

### `frontend/src/pages/ChangePassword.jsx`
```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const { updateUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      updateUser({ mustChangePassword: false })
      toast.success('Password changed! Please log in again.')
      logout()
      navigate('/login')
    } catch (err) {
      const e = err.response?.data
      if (e?.details) e.details.forEach(d => toast.error(d))
      else toast.error(e?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={{ fontSize: '2rem' }}>🔑</span>
        <h2 style={{ marginTop: '0.5rem', marginBottom: '0.3rem' }}>Set New Password</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
          This is your first login. You must set a new password to continue.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            ['currentPassword', 'Temporary Password', 'Your temporary password from email'],
            ['newPassword', 'New Password', 'Min 8 chars, uppercase, number, special char'],
            ['confirm', 'Confirm New Password', 'Re-enter new password']
          ].map(([key, label, hint]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>{label}</label>
              <input type="password" value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={hint} required />
            </div>
          ))}
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Password must contain: 8+ chars • uppercase • lowercase • number • special character
          </div>
          <button type="submit" disabled={loading} style={{
            background: 'var(--color-primary)', color: 'white', padding: '0.8rem',
            borderRadius: 'var(--radius)', fontWeight: 600, marginTop: '0.5rem'
          }}>
            {loading ? 'Saving...' : 'Set New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--color-bg)', padding: '1rem'
  },
  card: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px',
    textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  }
}
```

### `frontend/src/layouts/DashboardLayout.jsx`
```jsx
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
```

### `frontend/src/pages/Dashboard.jsx`
```jsx
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'

const StatCard = ({ icon, label, value, color = '#3498db', sub }) => (
  <div style={{
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: '1.2rem',
    borderTop: `3px solid ${color}`
  }}>
    <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value ?? '—'}</div>
    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.3rem' }}>{sub}</div>}
  </div>
)

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: report, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/reports/dashboard').then(r => r.data),
    refetchInterval: 60000
  })

  const { data: extList } = useQuery({
    queryKey: ['extinguishers-recent'],
    queryFn: () => api.get('/api/extinguishers?limit=5&page=1').then(r => r.data)
  })

  if (isLoading) return <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Loading dashboard...</div>

  const ext = report?.extinguishers || {}
  const insp = report?.inspections || {}

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.firstName} 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
          Here's your fire safety overview — {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alert banner for expired */}
      {ext.expired > 0 && (
        <div style={{
          background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e74c3c', fontSize: '0.9rem'
        }}>
          ⚠️ <strong>{ext.expired} extinguisher{ext.expired > 1 ? 's' : ''} expired</strong> — immediate action required
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon="🧯" label="Total Extinguishers" value={ext.total} color="#3498db" />
        <StatCard icon="✅" label="Active" value={ext.active} color="#27ae60" />
        <StatCard icon="❌" label="Expired" value={ext.expired} color="#e74c3c" />
        <StatCard icon="🔧" label="In Maintenance" value={ext.maintenance} color="#f39c12" />
        <StatCard icon="⏰" label="Expiring Soon" value={ext.expiringSoon} color="#e67e22" sub="Within 30 days" />
        <StatCard icon="🔍" label="Inspections Due" value={insp.scheduled} color="#9b59b6" />
        <StatCard icon="✔️" label="Completed" value={insp.completed} color="#1abc9c" sub="All time" />
        <StatCard icon="📅" label="This Month" value={insp.thisMonth} color="#3498db" sub="Inspections" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>🧯 Recent Extinguishers</h3>
          {extList?.data?.map(e => (
            <div key={e.id} style={styles.listItem}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{e.serialNumber}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{e.location}</div>
              </div>
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500,
                background: e.status === 'active' ? 'rgba(39,174,96,0.15)' : e.status === 'expired' ? 'rgba(231,76,60,0.15)' : 'rgba(243,156,18,0.15)',
                color: e.status === 'active' ? '#27ae60' : e.status === 'expired' ? '#e74c3c' : '#f39c12'
              }}>{e.status}</span>
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>📊 By Type</h3>
          {(ext.byType || []).map(({ type, count }) => (
            <div key={type} style={styles.listItem}>
              <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>
                {type?.replace(/_/g, ' ')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  height: '6px', borderRadius: '3px', background: 'var(--color-primary)',
                  width: `${Math.min((count / (ext.total || 1)) * 100, 100)}px`
                }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  panel: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: '1.2rem'
  },
  panelTitle: { fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' },
  listItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)'
  }
}
```

### `frontend/src/pages/Extinguishers.jsx`
```jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import toast from 'react-hot-toast'

const TYPES = ['water', 'co2', 'foam', 'dry_chemical', 'wet_chemical', 'halon']
const SIZES = ['2.5lbs', '5lbs', '9lbs', '12lbs', '20lbs']
const STATUS_COLORS = {
  active: '#27ae60', expired: '#e74c3c', maintenance: '#f39c12',
  decommissioned: '#95a5a6', missing: '#e67e22'
}

const defaultForm = {
  serialNumber: '', location: '', building: '', floor: '', room: '',
  type: 'co2', size: '5lbs', manufacturer: '', model: '',
  installationDate: '', expiryDate: '', notes: '', pressure: ''
}

export default function ExtinguishersPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['extinguishers', page, search, filterStatus, filterType],
    queryFn: () => api.get('/api/extinguishers', {
      params: { page, limit: 15, search: search || undefined,
        status: filterStatus || undefined, type: filterType || undefined }
    }).then(r => r.data)
  })

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/api/extinguishers', body),
    onSuccess: () => {
      qc.invalidateQueries(['extinguishers'])
      setShowForm(false)
      setForm(defaultForm)
      toast.success('Extinguisher registered!')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  const canCreate = ['admin', 'inspector'].includes(user?.role)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>🧯 Fire Extinguishers</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {data?.pagination?.total ?? 0} registered
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} style={{
            background: 'var(--color-primary)', color: 'white', padding: '0.6rem 1.2rem',
            borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.9rem'
          }}>+ Register New</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input placeholder="Search serial, location..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ maxWidth: '280px' }} />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          style={{ width: 'auto' }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
          style={{ width: 'auto' }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-2)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {['Serial Number', 'Location', 'Type', 'Size', 'Expiry Date', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No extinguishers found</td></tr>
            ) : data?.data?.map(ext => (
              <tr key={ext.id} style={{ borderTop: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.82rem' }}>
                  {ext.serialNumber}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div>{ext.location}</div>
                  {ext.building && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{ext.building}</div>}
                </td>
                <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{ext.type?.replace(/_/g, ' ')}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{ext.size}</td>
                <td style={{ padding: '0.75rem 1rem', color: new Date(ext.expiryDate) < new Date() ? '#e74c3c' : 'inherit' }}>
                  {ext.expiryDate}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500,
                    background: `${STATUS_COLORS[ext.status]}22`,
                    color: STATUS_COLORS[ext.status]
                  }}>{ext.status}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button onClick={() => navigate(`/extinguishers/${ext.id}`)}
                    style={{ background: 'none', color: 'var(--color-text-muted)', fontSize: '1rem', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius)' }}>
                    →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>←</button>
          <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {page} / {data.pagination.totalPages}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages} style={styles.pageBtn}>→</button>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div style={styles.modal} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600 }}>Register New Extinguisher</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                ['serialNumber', 'Serial Number', 'text', true],
                ['location', 'Location', 'text', true],
                ['building', 'Building', 'text', false],
                ['floor', 'Floor', 'text', false],
                ['manufacturer', 'Manufacturer', 'text', false],
                ['model', 'Model', 'text', false],
                ['installationDate', 'Installation Date', 'date', true],
                ['expiryDate', 'Expiry Date', 'date', true],
                ['pressure', 'Pressure Reading', 'text', false],
              ].map(([key, label, type, req]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}{req && ' *'}</label>
                  <input type={type} value={form[key]} required={req}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Size *</label>
                <select value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Notes</label>
                <textarea value={form.notes} rows={2}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-muted)'
                }}>Cancel</button>
                <button type="submit" disabled={createMutation.isPending} style={{
                  background: 'var(--color-primary)', color: 'white',
                  padding: '0.6rem 1.5rem', borderRadius: 'var(--radius)', fontWeight: 600
                }}>{createMutation.isPending ? 'Saving...' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  pageBtn: {
    padding: '0.4rem 0.8rem', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    color: 'var(--color-text-muted)', cursor: 'pointer'
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
  },
  modalContent: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '680px',
    maxHeight: '90vh', overflow: 'auto'
  }
}
```

### `frontend/src/pages/Reports.jsx`
```jsx
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { data: dash } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: () => api.get('/api/reports/dashboard').then(r => r.data)
  })

  const exportReport = async (type, format) => {
    try {
      const res = await api.get('/api/reports/export', {
        params: { type, format }, responseType: 'blob'
      })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${Date.now()}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${type} report downloaded`)
    } catch (e) {
      toast.error('Export failed')
    }
  }

  const ext = dash?.extinguishers || {}
  const insp = dash?.inspections || {}
  const maint = dash?.maintenance || {}

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>📄 Reports & Analytics</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Real-time data — Last updated: {dash?.generatedAt ? new Date(dash.generatedAt).toLocaleTimeString() : '—'}
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Extinguishers', val: ext.total, color: '#3498db', icon: '🧯' },
          { label: 'Active Units', val: ext.active, color: '#27ae60', icon: '✅' },
          { label: 'Expired', val: ext.expired, color: '#e74c3c', icon: '❌' },
          { label: 'Expiring (30d)', val: ext.expiringSoon, color: '#e67e22', icon: '⏰' },
          { label: 'Inspections (Month)', val: insp.thisMonth, color: '#9b59b6', icon: '🔍' },
          { label: 'Inspections (Year)', val: insp.thisYear, color: '#1abc9c', icon: '📅' },
          { label: 'Maintenance (Month)', val: maint.thisMonth, color: '#f39c12', icon: '🔧' },
          { label: 'Missed Inspections', val: insp.missed, color: '#e74c3c', icon: '⚠️' },
        ].map(({ label, val, color, icon }) => (
          <div key={label} style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: '1rem', borderTop: `3px solid ${color}`
          }}>
            <div style={{ fontSize: '1.4rem' }}>{icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color, marginTop: '0.3rem' }}>{val ?? '—'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Export Section */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>📥 Export Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {[
            { type: 'extinguishers', label: 'Extinguishers Report', icon: '🧯', desc: 'All equipment, types, statuses' },
            { type: 'inspections', label: 'Inspections Report', icon: '🔍', desc: 'Schedule, results, history' },
            { type: 'maintenance', label: 'Maintenance History', icon: '🔧', desc: 'Actions, costs, conditions' },
          ].map(({ type, label, icon, desc }) => (
            <div key={type} style={{
              background: 'var(--color-surface-2)', borderRadius: 'var(--radius)',
              padding: '1rem', border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{desc}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => exportReport(type, 'pdf')} style={{
                  flex: 1, padding: '0.5rem', borderRadius: 'var(--radius)',
                  background: 'rgba(231,76,60,0.15)', color: '#e74c3c',
                  border: '1px solid rgba(231,76,60,0.3)', fontSize: '0.8rem', fontWeight: 600
                }}>📄 PDF</button>
                <button onClick={() => exportReport(type, 'csv')} style={{
                  flex: 1, padding: '0.5rem', borderRadius: 'var(--radius)',
                  background: 'rgba(39,174,96,0.15)', color: '#27ae60',
                  border: '1px solid rgba(39,174,96,0.3)', fontSize: '0.8rem', fontWeight: 600
                }}>📊 CSV</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

---
