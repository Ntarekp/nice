import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import MaterialIcon from '../components/MaterialIcon'

export default function OtpPage() {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const refs = useRef([])
  const { pendingUserId, pendingOtpPurpose, token, loginSuccess } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const purpose = location.state?.purpose || pendingOtpPurpose || 'login'

  // Redirect if session missing (GuestOnly handles already-signed-in users).
  useEffect(() => {
    if (!pendingUserId && !token) navigate('/login', { replace: true })
  }, [pendingUserId, token, navigate])

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
      const { data } = await api.post('/api/auth/verify-otp', {
        userId: pendingUserId,
        otp,
        purpose,
      })
      loginSuccess(data.user, data.accessToken, data.refreshToken)
      toast.success('Welcome!')
      if (data.mustChangePassword || location.state?.mustChangePassword) {
        navigate('/change-password')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      const body = err.response?.data
      if (err.response?.status === 422 && body?.errors?.length) {
        toast.error(body.errors[0]?.msg || 'Enter a valid 6-digit code')
      } else if (err.response?.status === 429) {
        toast.error(body?.error || 'Too many attempts — wait a few minutes')
      } else {
        toast.error(body?.error || 'Invalid OTP')
      }
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-surface-bright p-4 md:p-8">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40vw] w-[40vw] rounded-full bg-primary-fixed/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[30vw] w-[30vw] rounded-full bg-secondary-fixed/20 blur-[100px]" />

      <main className="relative z-10 w-full max-w-[420px] rounded-xl border border-border-ice bg-surface-white/90 p-8 text-center shadow-lg backdrop-blur-md md:p-12">
        <div className="mb-6 flex justify-center">
          <MaterialIcon name="mark_email_read" size={40} fill className="text-primary" />
        </div>
        <h2 className="mb-1 text-headline-md text-text-primary">Check your email</h2>
        <p className="mb-8 text-sm text-text-secondary">
          We sent a 6-digit code. It expires in 10 minutes.
        </p>

        <div className="mb-8 flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`h-[54px] w-11 rounded-xl border-2 text-center text-lg font-bold text-text-primary outline-none transition-colors focus:border-primary ${
                d ? 'border-primary' : 'border-border-ice'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-[12px] text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? 'Verifying…' : 'Verify OTP'}
          <MaterialIcon name="arrow_forward" size={18} />
        </button>

        <button
          type="button"
          className="mt-6 text-sm text-text-secondary transition-colors hover:text-primary"
          onClick={() => navigate('/login')}
        >
          ← Back to login
        </button>
      </main>
    </div>
  )
}
