import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setLoginPending, loginSuccess } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      if (data.accessToken && data.user) {
        loginSuccess(data.user, data.accessToken, data.refreshToken)
        toast.success('Welcome back!')
        if (data.mustChangePassword) navigate('/change-password')
        else navigate('/dashboard')
        return
      }
      setLoginPending(data.userId)
      toast.success('OTP sent to your email')
      navigate('/otp', { state: { mustChangePassword: data.mustChangePassword } })
    } catch (err) {
      const body = err.response?.data
      if (err.response?.status === 403 && body?.requiresOtp && body?.userId) {
        setLoginPending(body.userId)
        toast.success('OTP sent to your email')
        navigate('/otp')
        return
      }
      toast.error(body?.error || 'Login failed')
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
        <p style={styles.subtitle}>Verified accounts sign in directly; unverified accounts receive an OTP by email.</p>

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
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={styles.notice}>
          🔐 New registrations must verify email with a one-time password.
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
