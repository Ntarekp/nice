import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import MaterialIcon from '../components/MaterialIcon'
import { LOGIN_ILLUSTRATION } from '../lib/designAssets'

export default function LoginPage() {
  const location = useLocation()
  const [email, setEmail] = useState(() => location.state?.email || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { setLoginPending, token } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (token) {
      navigate('/dashboard', { replace: true })
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/login', { email, password })
      toast.error('Unexpected login response — please try again')
    } catch (err) {
      const body = err.response?.data
      if (err.response?.status === 403 && body?.requiresOtp && body?.userId) {
        const purpose = body.purpose || 'login'
        setLoginPending(body.userId, purpose)
        toast.success(
          body.emailSent === false
            ? 'Email could not be sent — check server logs for the code'
            : 'Verification code sent to your email'
        )
        if (import.meta.env.DEV && body.devOtpHint) {
          console.info('[dev] Login OTP for', email, ':', body.devOtpHint)
          toast(`Dev code: ${body.devOtpHint}`, { icon: '🔑', duration: 20000 })
        }
        navigate('/otp', {
          state: {
            mustChangePassword: body.mustChangePassword,
            purpose,
          },
        })
        return
      }
      if (err.response?.status === 422 && body?.errors?.length) {
        toast.error(body.errors[0]?.msg || 'Invalid input')
        return
      }
      toast.error(body?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface antialiased text-text-primary">
      <div className="relative hidden items-center justify-center bg-surface-container-high p-12 lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center opacity-90"
          style={{ backgroundImage: `url('${LOGIN_ILLUSTRATION}')` }}
          role="img"
          aria-label="Commercial facilities safety illustration"
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary-container/80 to-surface-tint/60" />
        
      </div>

      <div className="relative flex w-full items-center justify-center bg-surface-bright px-5 lg:w-1/2 lg:px-10">
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(#172B4D 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="glass-panel relative z-10 w-full max-w-[480px] rounded-xl border border-border-ice p-8 shadow-sm lg:p-12">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <MaterialIcon name="local_fire_department" size={22} fill className="text-on-primary" />
            </div>
            <h1 className="text-headline-md font-extrabold tracking-tight text-primary">
              PyroGuard Pro
            </h1>
          </div>

          <div className="mb-8">
            <h2 className="mb-1 text-headline-lg text-primary">Welcome Back</h2>
            <p className="text-base text-text-secondary">
              Sign in to access your command center.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label
                className="mb-2 ml-1 block text-label-caps uppercase text-text-secondary"
                htmlFor="email"
              >
                Corporate Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <MaterialIcon name="mail" size={22} className="text-outline" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="auth-input block w-full rounded-xl border border-border-ice bg-surface-container-lowest py-3 pl-12 pr-4 text-sm text-primary placeholder:text-outline-variant focus:outline-none"
                  placeholder="executive@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label
                className="mb-2 ml-1 block text-label-caps uppercase text-text-secondary"
                htmlFor="password"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <MaterialIcon name="lock" size={22} className="text-outline" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input block w-full rounded-xl border border-border-ice bg-surface-container-lowest py-3 pl-12 pr-12 text-sm text-primary placeholder:text-outline-variant focus:outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-outline transition-colors hover:text-primary focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                >
                  <MaterialIcon name={showPassword ? 'visibility' : 'visibility_off'} size={22} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <input className="auth-checkbox" id="remember-me" name="remember-me" type="checkbox" />
                <label
                  className="cursor-pointer select-none text-sm text-text-secondary"
                  htmlFor="remember-me"
                >
                  Remember this device
                </label>
              </div>
              <Link
                className="text-label-small text-primary transition-all hover:text-primary-container hover:underline"
                to="/forgot-password"
              >
                Forgot password?
              </Link>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-sm transition-all hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/20 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Secure Sign In'}
                <MaterialIcon name="arrow_forward" size={20} />
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-label-small text-outline">
              Protected by Enterprise-Grade Encryption
              <br />
              © 2026 Kpntare Safety
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
