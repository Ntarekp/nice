import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import MaterialIcon from '../components/MaterialIcon'
import { getPasswordRules } from '../lib/passwordStrength'

const RESET_TOKEN_KEY = 'reset-token'

export default function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, clearLoginPending } = useAuthStore()
  const [email] = useState(
    () => location.state?.email || sessionStorage.getItem('reset-email') || ''
  )
  const [step, setStep] = useState(() =>
    sessionStorage.getItem(RESET_TOKEN_KEY) ? 'password' : 'otp'
  )
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = useRef([])
  const rules = getPasswordRules(newPassword)

  useEffect(() => {
    logout()
    clearLoginPending()
    if (!email) navigate('/forgot-password', { replace: true })
  }, [email, navigate, logout, clearLoginPending])

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

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    const otp = digits.join('')
    if (otp.length !== 6) return toast.error('Enter all 6 digits')

    setLoading(true)
    try {
      const { data } = await api.post('/api/auth/verify-reset-otp', { email, otp })
      sessionStorage.setItem(RESET_TOKEN_KEY, data.resetToken)
      setStep('password')
      toast.success('Code verified — choose a new password')
    } catch (err) {
      const d = err.response?.data
      toast.error(d?.error || 'Invalid or expired code. Request a new code from Forgot Password.')
      setDigits(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirm) return toast.error('Passwords do not match')

    const resetToken = sessionStorage.getItem(RESET_TOKEN_KEY)
    if (!resetToken) {
      toast.error('Reset session expired — request a new code')
      setStep('otp')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/auth/reset-password', { email, resetToken, newPassword })
      sessionStorage.removeItem('reset-email')
      sessionStorage.removeItem(RESET_TOKEN_KEY)
      toast.success('Password updated! Sign in with your new password.')
      navigate('/login', { replace: true, state: { email } })
    } catch (err) {
      const d = err.response?.data
      if (d?.details) d.details.forEach((m) => toast.error(m))
      else toast.error(d?.error || 'Reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-surface-bright p-4 md:p-8">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40vw] w-[40vw] rounded-full bg-primary-fixed/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[30vw] w-[30vw] rounded-full bg-secondary-fixed/20 blur-[100px]" />

      <main className="relative z-10 w-full max-w-[520px] rounded-xl border border-border-ice bg-surface-white/90 p-8 shadow-lg backdrop-blur-md md:p-12">
        <div className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <MaterialIcon name="shield_lock" size={28} fill className="text-primary" />
            <h1 className="text-headline-sm font-extrabold text-primary">PyroGuard Pro</h1>
          </div>
          <h2 className="mb-1 text-headline-md text-text-primary">
            {step === 'otp' ? 'Enter reset code' : 'New password'}
          </h2>
          <p className="text-sm text-text-secondary">
            {step === 'otp' ? (
              <>
                One-time code sent to{' '}
                <strong className="text-text-primary">{email}</strong>. It expires in 10 minutes.
              </>
            ) : (
              'Choose a strong password, then sign in.'
            )}
          </p>
          <p className="mt-2 text-xs text-outline">
            Step {step === 'otp' ? '1' : '2'} of 2
          </p>
        </div>

        {step === 'otp' ? (
          <form className="flex flex-col gap-4" onSubmit={handleVerifyOtp}>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
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
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={`h-[52px] w-11 rounded-xl border-2 text-center text-sm font-semibold text-text-primary outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 ${
                    d ? 'border-primary bg-surface-container-lowest' : 'border-border-ice bg-surface-container-lowest'
                  }`}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-[12px] text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Verify code'}
              <MaterialIcon name="arrow_forward" size={18} />
            </button>
          </form>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSetPassword}>
            <div>
              <label className="mb-1 block text-label-small text-text-primary" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                className="w-full rounded-xl border border-border-ice bg-surface-container-lowest px-4 py-[12px] text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-label-small text-text-primary" htmlFor="confirm-password">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                className="w-full rounded-xl border border-border-ice bg-surface-container-lowest px-4 py-[12px] text-sm text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <ul className="space-y-xs text-left">
              {[
                ['Minimum 12 characters', rules.length12],
                ['At least one uppercase letter', rules.uppercase],
                ['At least one numeric digit', rules.digit],
                ['At least one special character', rules.special],
              ].map(([text, met]) => (
                <li key={text} className={`flex items-center gap-2 text-sm ${met ? 'text-text-secondary' : 'text-outline'}`}>
                  <MaterialIcon name={met ? 'check_circle' : 'radio_button_unchecked'} size={16} fill={met} className={met ? 'text-secondary' : 'text-outline'} />
                  {text}
                </li>
              ))}
            </ul>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-[12px] text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save password'}
              <MaterialIcon name="arrow_forward" size={18} />
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          {step === 'otp' ? (
            <Link className="text-primary hover:underline" to="/forgot-password">
              Resend code
            </Link>
          ) : (
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                sessionStorage.removeItem(RESET_TOKEN_KEY)
                setStep('otp')
                setDigits(['', '', '', '', '', ''])
              }}
            >
              Use a different code
            </button>
          )}
          {' · '}
          <Link className="text-primary hover:underline" to="/login">
            Back to login
          </Link>
        </p>
      </main>
    </div>
  )
}
