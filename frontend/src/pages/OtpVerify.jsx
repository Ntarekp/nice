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
