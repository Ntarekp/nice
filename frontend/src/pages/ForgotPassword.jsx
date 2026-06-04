import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      toast.success('If that email exists, a reset code was sent')
      navigate('/reset-password', { state: { email } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', textAlign: 'center' }}>🔐</div>
        <h2 style={styles.title}>Forgot password</h2>
        <p style={styles.sub}>
          Enter your account email. We will send a 6-digit reset code if the account exists.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
            />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Sending...' : 'Send reset code'}
          </button>
        </form>

        <p style={styles.back}>
          <Link to="/login">← Back to login</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--color-bg)',
    padding: '1rem',
  },
  card: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: '16px',
    padding: '2.5rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  title: { fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem', textAlign: 'center' },
  sub: {
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
    marginBottom: '1.8rem',
    textAlign: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' },
  btn: {
    width: '100%',
    background: 'var(--color-primary)',
    color: 'white',
    padding: '0.8rem',
    borderRadius: 'var(--radius)',
    fontWeight: 600,
    fontSize: '0.95rem',
    marginTop: '0.5rem',
  },
  back: {
    marginTop: '1.25rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
  },
}
