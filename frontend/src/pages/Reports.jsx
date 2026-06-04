import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { downloadReport } from '../lib/exportReport'
import { REPORT_TYPES_BY_ROLE } from '../lib/navConfig'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { user } = useAuthStore()
  const [exporting, setExporting] = useState(null)
  const reportTypes = REPORT_TYPES_BY_ROLE[user?.role] || []

  const { data: dash, isLoading } = useQuery({
    queryKey: ['reports-dashboard', user?.role],
    queryFn: () => api.get('/api/reports/dashboard').then((r) => r.data),
  })

  const handleExport = async (type, format) => {
    const key = `${type}-${format}`
    setExporting(key)
    try {
      await downloadReport(type, format)
      toast.success(`${format.toUpperCase()} downloaded`)
    } catch (e) {
      toast.error(e.message || 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  const ext = dash?.extinguishers || {}
  const insp = dash?.inspections || {}
  const maint = dash?.maintenance || {}

  const stats = [
    { label: 'Total Extinguishers', val: ext.total, color: '#2563eb' },
    { label: 'Active', val: ext.active, color: '#16a34a' },
    { label: 'Expired', val: ext.expired, color: '#dc2626' },
    { label: 'Expiring (30d)', val: ext.expiringSoon, color: '#d97706' },
    ...(user?.role !== 'user'
      ? [
          { label: 'Inspections (Month)', val: insp.thisMonth, color: '#7c3aed' },
          { label: 'Maintenance (Month)', val: maint.thisMonth, color: '#ca8a04' },
        ]
      : [
          { label: 'My Inspections', val: insp.total, color: '#7c3aed' },
          { label: 'Completed', val: insp.completed, color: '#16a34a' },
        ]),
  ]

  return (
    <div>
      <p className="breadcrumb">Reports <span>›</span> Export Center</p>
      <h1 className="page-title" style={{ marginBottom: '0.35rem' }}>Reports & Analytics</h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
        {user?.role === 'admin' && 'System-wide exports (PDF / CSV)'}
        {user?.role === 'inspector' && 'Exports for your inspection scope'}
        {user?.role === 'user' && 'Exports for your facility data'}
        {dash?.generatedAt && ` — updated ${new Date(dash.generatedAt).toLocaleTimeString()}`}
      </p>

      {isLoading ? (
        <p className="text-muted">Loading summary…</p>
      ) : (
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          {stats.map(({ label, val, color }) => (
            <div key={label} className="stat-card">
              <div className="stat-value" style={{ color }}>{val ?? '—'}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Export Reports</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {reportTypes.map(({ type, label, desc }) => (
              <div
                key={type}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  padding: '1.15rem',
                  background: 'var(--color-surface-muted)',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{label}</div>
                <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>{desc}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ flex: 1, fontSize: '0.8rem' }}
                    disabled={exporting === `${type}-pdf`}
                    onClick={() => handleExport(type, 'pdf')}
                  >
                    {exporting === `${type}-pdf` ? '…' : 'PDF'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '0.8rem' }}
                    disabled={exporting === `${type}-csv`}
                    onClick={() => handleExport(type, 'csv')}
                  >
                    {exporting === `${type}-csv` ? '…' : 'CSV'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
