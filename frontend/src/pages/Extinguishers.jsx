import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import toast from 'react-hot-toast'

const TYPES = ['water', 'co2', 'foam', 'dry_chemical', 'wet_chemical', 'halon']
const SIZES = ['2.5lbs', '5lbs', '9lbs', '12lbs', '20lbs']
const STATUS_COLORS = {
  active: '#27ae60', expired: '#e74c3c', maintenance: '#f39c12',
  decommissioned: '#95a5a6', missing: '#e67e22'
}

const defaultForm = {
  serialNumber: '', location: '', building: '', floor: '', room: '',
  type: 'co2', size: '5lbs', manufacturer: '', model: '',
  installationDate: '', expiryDate: '', notes: '', pressure: ''
}

export default function ExtinguishersPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['extinguishers', page, search, filterStatus, filterType],
    queryFn: () => api.get('/api/extinguishers', {
      params: { page, limit: 15, search: search || undefined,
        status: filterStatus || undefined, type: filterType || undefined }
    }).then(r => r.data)
  })

  const createMutation = useMutation({
    mutationFn: (body) => api.post('/api/extinguishers', body),
    onSuccess: () => {
      qc.invalidateQueries(['extinguishers'])
      setShowForm(false)
      setForm(defaultForm)
      toast.success('Extinguisher registered!')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to create')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  const canCreate = ['admin', 'inspector'].includes(user?.role)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>🧯 Fire Extinguishers</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            {data?.pagination?.total ?? 0} registered
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} style={{
            background: 'var(--color-primary)', color: 'white', padding: '0.6rem 1.2rem',
            borderRadius: 'var(--radius)', fontWeight: 600, fontSize: '0.9rem'
          }}>+ Register New</button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input placeholder="Search serial, location..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ maxWidth: '280px' }} />
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          style={{ width: 'auto' }}>
          <option value="">All Status</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1) }}
          style={{ width: 'auto' }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-2)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {['Serial Number', 'Location', 'Type', 'Size', 'Expiry Date', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '0.8rem 1rem', textAlign: 'left', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>No extinguishers found</td></tr>
            ) : data?.data?.map(ext => (
              <tr key={ext.id} style={{ borderTop: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.82rem' }}>
                  {ext.serialNumber}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <div>{ext.location}</div>
                  {ext.building && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{ext.building}</div>}
                </td>
                <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize' }}>{ext.type?.replace(/_/g, ' ')}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{ext.size}</td>
                <td style={{ padding: '0.75rem 1rem', color: new Date(ext.expiryDate) < new Date() ? '#e74c3c' : 'inherit' }}>
                  {ext.expiryDate}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500,
                    background: `${STATUS_COLORS[ext.status]}22`,
                    color: STATUS_COLORS[ext.status]
                  }}>{ext.status}</span>
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <button onClick={() => navigate(`/extinguishers/${ext.id}`)}
                    style={{ background: 'none', color: 'var(--color-text-muted)', fontSize: '1rem', padding: '0.2rem 0.4rem', borderRadius: 'var(--radius)' }}>
                    →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data?.pagination?.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>←</button>
          <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {page} / {data.pagination.totalPages}
          </span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.totalPages} style={styles.pageBtn}>→</button>
        </div>
      )}

      {/* Create Modal */}
      {showForm && (
        <div style={styles.modal} onClick={() => setShowForm(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 600 }}>Register New Extinguisher</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                ['serialNumber', 'Serial Number', 'text', true],
                ['location', 'Location', 'text', true],
                ['building', 'Building', 'text', false],
                ['floor', 'Floor', 'text', false],
                ['manufacturer', 'Manufacturer', 'text', false],
                ['model', 'Model', 'text', false],
                ['installationDate', 'Installation Date', 'date', true],
                ['expiryDate', 'Expiry Date', 'date', true],
                ['pressure', 'Pressure Reading', 'text', false],
              ].map(([key, label, type, req]) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}{req && ' *'}</label>
                  <input type={type} value={form[key]} required={req}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Size *</label>
                <select value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Notes</label>
                <textarea value={form.notes} rows={2}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '0.6rem 1.2rem', borderRadius: 'var(--radius)',
                  border: '1px solid var(--color-border)', background: 'none', color: 'var(--color-text-muted)'
                }}>Cancel</button>
                <button type="submit" disabled={createMutation.isPending} style={{
                  background: 'var(--color-primary)', color: 'white',
                  padding: '0.6rem 1.5rem', borderRadius: 'var(--radius)', fontWeight: 600
                }}>{createMutation.isPending ? 'Saving...' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  pageBtn: {
    padding: '0.4rem 0.8rem', background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', borderRadius: 'var(--radius)',
    color: 'var(--color-text-muted)', cursor: 'pointer'
  },
  modal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
  },
  modalContent: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '680px',
    maxHeight: '90vh', overflow: 'auto'
  }
}
