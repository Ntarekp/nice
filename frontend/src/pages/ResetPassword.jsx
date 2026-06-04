import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import MaterialIcon from '../components/MaterialIcon'
import { getPasswordRules } from '../lib/passwordStrength'

export default function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState(location.state?.email || '')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = useRef([])
  const rules = getPasswordRules(newPassword)

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
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-surface-bright p-4 md:p-8">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40vw] w-[40vw] rounded-full bg-primary-fixed/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[30vw] w-[30vw] rounded-full bg-secondary-fixed/20 blur-[100px]" />

      <main className="relative z-10 w-full max-w-[520px] rounded-xl border border-border-ice bg-surface-white/90 p-8 shadow-lg backdrop-blur-md md:p-12">
        <div className="mb-8 text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <MaterialIcon name="shield_lock" size={28} fill className="text-primary" />
            <h1 className="text-headline-sm font-extrabold text-primary">PyroGuard Pro</h1>
          </div>
          <h2 className="mb-1 text-headline-md text-text-primary">Reset Password</h2>
          <p className="text-sm text-text-secondary">
            Enter the code sent to <strong className="text-text-primary">{email}</strong> and choose a new password.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
            {loading ? 'Resetting…' : 'Reset password'}
            <MaterialIcon name="arrow_forward" size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link className="text-primary hover:underline" to="/forgot-password">
            Resend code
          </Link>
          {' · '}
          <Link className="text-primary hover:underline" to="/login">
            Back to login
          </Link>
        </p>
      </main>
    </div>
  )
}
