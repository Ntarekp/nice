import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const { updateUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match')
    setLoading(true)
    try {
      await api.post('/api/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      updateUser({ mustChangePassword: false })
      toast.success('Password changed! Please log in again.')
      logout()
      navigate('/login')
    } catch (err) {
      const e = err.response?.data
      if (e?.details) e.details.forEach(d => toast.error(d))
      else toast.error(e?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <span style={{ fontSize: '2rem' }}>🔑</span>
        <h2 style={{ marginTop: '0.5rem', marginBottom: '0.3rem' }}>Set New Password</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
          This is your first login. You must set a new password to continue.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            ['currentPassword', 'Temporary Password', 'Your temporary password from email'],
            ['newPassword', 'New Password', 'Min 8 chars, uppercase, number, special char'],
            ['confirm', 'Confirm New Password', 'Re-enter new password']
          ].map(([key, label, hint]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>{label}</label>
              <input type="password" value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={hint} required />
            </div>
          ))}
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Password must contain: 8+ chars • uppercase • lowercase • number • special character
          </div>
          <button type="submit" disabled={loading} style={{
            background: 'var(--color-primary)', color: 'white', padding: '0.8rem',
            borderRadius: 'var(--radius)', fontWeight: 600, marginTop: '0.5rem'
          }}>
            {loading ? 'Saving...' : 'Set New Password'}
          </button>
        </form>
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
    borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px',
    textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
  }
}
