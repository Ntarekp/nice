import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'
import MaterialIcon from '../components/MaterialIcon'
import { SECURITY_SHIELD_IMAGE } from '../lib/designAssets'
import { getPasswordRules, getPasswordStrength } from '../lib/passwordStrength'

function PasswordField({ id, label, value, onChange, placeholder, showToggle = true }) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label className="mb-1 block text-label-small text-text-primary" htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="w-full rounded-xl border border-border-ice bg-surface-container-lowest px-4 py-[12px] pr-8 text-sm text-text-primary outline-none transition-all placeholder:text-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />
        {showToggle && (
          <button
            type="button"
            aria-label="Toggle password visibility"
            className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-text-secondary transition-colors hover:text-primary"
            onClick={() => setVisible((v) => !v)}
          >
            <MaterialIcon name={visible ? 'visibility_off' : 'visibility'} size={20} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const { updateUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const strength = getPasswordStrength(form.newPassword)
  const rules = getPasswordRules(form.newPassword)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      })
      updateUser({ mustChangePassword: false })
      toast.success('Password changed! Please log in again.')
      logout()
      navigate('/login')
    } catch (err) {
      const body = err.response?.data
      if (body?.details) body.details.forEach((d) => toast.error(d))
      else toast.error(body?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-surface-bright p-4 md:p-8">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[40vw] w-[40vw] rounded-full bg-primary-fixed/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[30vw] w-[30vw] rounded-full bg-secondary-fixed/20 blur-[100px]" />

      <main className="relative z-10 flex w-full max-w-[960px] flex-col overflow-hidden rounded-xl border border-border-ice bg-surface-white/90 shadow-lg backdrop-blur-md md:flex-row">
        <section className="flex flex-1 flex-col justify-center p-8 md:p-12">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2">
              <MaterialIcon name="shield_lock" size={28} fill className="text-primary" />
              <h1 className="text-headline-sm font-extrabold tracking-tight text-primary">
                TWZ-LTD              </h1>
            </div>
            <h2 className="mb-1 text-headline-md text-text-primary">Set New Password</h2>
            <p className="text-sm text-text-secondary">
              For your security, please update your temporary credentials to establish your executive access.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <PasswordField
              id="current-password"
              label="Current Temporary Password"
              placeholder="Enter temporary password"
              value={form.currentPassword}
              onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            />

            <div>
              <PasswordField
                id="new-password"
                label="New Password"
                placeholder="Create a strong password"
                value={form.newPassword}
                onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
              />
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex h-[4px] w-full gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-full ${
                        i < strength.score ? 'bg-secondary' : 'bg-surface-variant'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label-small text-secondary">{strength.label}</span>
                </div>
              </div>
            </div>

            <PasswordField
              id="confirm-password"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              showToggle={false}
            />

            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-[12px] text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                <span>{loading ? 'Updating…' : 'Update Protocol'}</span>
                <MaterialIcon name="arrow_forward" size={18} />
              </button>
            </div>
          </form>
        </section>

        <aside className="hidden w-[380px] flex-col items-center justify-center border-l border-border-ice bg-surface-container-low p-8 text-center md:flex">
          <div className="relative mb-6 flex h-48 w-48 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary-fixed/50 blur-2xl" />
            <img
              src={SECURITY_SHIELD_IMAGE}
              alt="Cybersecurity shield illustration"
              className="relative z-10 h-full w-full rounded-full border-4 border-surface-white object-cover shadow-sm mix-blend-multiply"
            />
          </div>
          <h3 className="mb-4 text-sm font-semibold text-text-primary">Executive Security Standards</h3>
          <ul className="w-full space-y-2 text-left">
            {[
              ['Minimum 12 characters', rules.length12],
              ['At least one uppercase letter', rules.uppercase],
              ['At least one numeric digit', rules.digit],
              ['At least one special character', rules.special],
            ].map(([text, met]) => (
              <li key={text} className={`flex items-center gap-2 text-sm ${met ? 'text-text-secondary' : 'text-outline'}`}>
                <MaterialIcon
                  name={met ? 'check_circle' : 'radio_button_unchecked'}
                  size={16}
                  fill={met}
                  className={met ? 'text-secondary' : 'text-outline'}
                />
                {text}
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  )
}
