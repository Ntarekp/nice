import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import MaterialIcon from '../components/MaterialIcon'

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
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-surface-bright p-4 md:p-8">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40vw] w-[40vw] rounded-full bg-primary-fixed/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[30vw] w-[30vw] rounded-full bg-secondary-fixed/20 blur-[100px]" />

      <main className="relative z-10 w-full max-w-[480px] rounded-xl border border-border-ice bg-surface-white/90 p-8 shadow-lg backdrop-blur-md md:p-12">
        <div className="mb-8">
          <div className="mb-6 flex items-center gap-2">
            <MaterialIcon name="shield_lock" size={28} fill className="text-primary" />
            <h1 className="text-headline-sm font-extrabold tracking-tight text-primary">
              TWZ-LTD            </h1>
          </div>
          <h2 className="mb-1 text-headline-md text-text-primary">Forgot Password</h2>
          <p className="text-sm text-text-secondary">
            Enter your account email. We will send a 6-digit reset code if the account exists.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-label-small text-text-primary" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-xl border border-border-ice bg-surface-container-lowest px-4 py-[12px] text-sm text-text-primary outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="executive@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-[12px] text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset code'}
            <MaterialIcon name="arrow_forward" size={18} />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link className="text-primary hover:underline" to="/login">
            ← Back to login
          </Link>
        </p>
      </main>
    </div>
  )
}
