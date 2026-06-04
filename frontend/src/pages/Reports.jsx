import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { data: dash } = useQuery({
    queryKey: ['reports-dashboard'],
    queryFn: () => api.get('/api/reports/dashboard').then(r => r.data)
  })

  const exportReport = async (type, format) => {
    try {
      const res = await api.get('/api/reports/export', {
        params: { type, format }, responseType: 'blob'
      })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-report-${Date.now()}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${type} report downloaded`)
    } catch (e) {
      toast.error('Export failed')
    }
  }

  const ext = dash?.extinguishers || {}
  const insp = dash?.inspections || {}
  const maint = dash?.maintenance || {}

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>📄 Reports & Analytics</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          Real-time data — Last updated: {dash?.generatedAt ? new Date(dash.generatedAt).toLocaleTimeString() : '—'}
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Extinguishers', val: ext.total, color: '#3498db', icon: '🧯' },
          { label: 'Active Units', val: ext.active, color: '#27ae60', icon: '✅' },
          { label: 'Expired', val: ext.expired, color: '#e74c3c', icon: '❌' },
          { label: 'Expiring (30d)', val: ext.expiringSoon, color: '#e67e22', icon: '⏰' },
          { label: 'Inspections (Month)', val: insp.thisMonth, color: '#9b59b6', icon: '🔍' },
          { label: 'Inspections (Year)', val: insp.thisYear, color: '#1abc9c', icon: '📅' },
          { label: 'Maintenance (Month)', val: maint.thisMonth, color: '#f39c12', icon: '🔧' },
          { label: 'Missed Inspections', val: insp.missed, color: '#e74c3c', icon: '⚠️' },
        ].map(({ label, val, color, icon }) => (
          <div key={label} style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', padding: '1rem', borderTop: `3px solid ${color}`
          }}>
            <div style={{ fontSize: '1.4rem' }}>{icon}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color, marginTop: '0.3rem' }}>{val ?? '—'}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Export Section */}
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>📥 Export Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {[
            { type: 'extinguishers', label: 'Extinguishers Report', icon: '🧯', desc: 'All equipment, types, statuses' },
            { type: 'inspections', label: 'Inspections Report', icon: '🔍', desc: 'Schedule, results, history' },
            { type: 'maintenance', label: 'Maintenance History', icon: '🔧', desc: 'Actions, costs, conditions' },
          ].map(({ type, label, icon, desc }) => (
            <div key={type} style={{
              background: 'var(--color-surface-2)', borderRadius: 'var(--radius)',
              padding: '1rem', border: '1px solid var(--color-border)'
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{icon}</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{desc}</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => exportReport(type, 'pdf')} style={{
                  flex: 1, padding: '0.5rem', borderRadius: 'var(--radius)',
                  background: 'rgba(231,76,60,0.15)', color: '#e74c3c',
                  border: '1px solid rgba(231,76,60,0.3)', fontSize: '0.8rem', fontWeight: 600
                }}>📄 PDF</button>
                <button onClick={() => exportReport(type, 'csv')} style={{
                  flex: 1, padding: '0.5rem', borderRadius: 'var(--radius)',
                  background: 'rgba(39,174,96,0.15)', color: '#27ae60',
                  border: '1px solid rgba(39,174,96,0.3)', fontSize: '0.8rem', fontWeight: 600
                }}>📊 CSV</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
