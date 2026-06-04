import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || '')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = useRef([])

  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true })
  }, [email, navigate])

  const handleDigitChange = (i, val) => {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otp = digits.join('')
    if (otp.length !== 6) return toast.error('Enter all 6 digits')
    if (newPassword !== confirm) return toast.error('Passwords do not match')

    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { email, otp, newPassword })
      toast.success('Password reset! Please sign in.')
      navigate('/login')
    } catch (err) {
      const d = err.response?.data
      if (d?.details) d.details.forEach((m) => toast.error(m))
      else toast.error(d?.error || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Reset password</h2>
        <p style={styles.sub}>
          Enter the code sent to <strong>{email}</strong> and choose a new password.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputs} onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  ...styles.digit,
                  borderColor: d ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              />
            ))}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <p style={styles.hint}>
            Min 8 chars · uppercase · lowercase · number · special character
          </p>

          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p style={styles.back}>
          <Link to="/forgot-password">Resend code</Link>
          {' · '}
          <Link to="/login">Back to login</Link>
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
    marginBottom: '1.5rem',
    textAlign: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  inputs: { display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '0.5rem' },
  digit: {
    width: '44px',
    height: '52px',
    textAlign: 'center',
    fontSize: '1.4rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    borderRadius: 'var(--radius)',
    border: '2px solid',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' },
  hint: { fontSize: '0.78rem', color: 'var(--color-text-dim)' },
  btn: {
    background: 'var(--color-primary)',
    color: 'white',
    padding: '0.8rem',
    borderRadius: 'var(--radius)',
    fontWeight: 600,
    fontSize: '0.95rem',
    marginTop: '0.25rem',
  },
  back: {
    marginTop: '1.25rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--color-text-muted)',
  },
}
