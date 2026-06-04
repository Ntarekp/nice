import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { statusBadgeClass } from '../lib/badges'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: () => api.get('/api/reports/dashboard').then((r) => r.data),
    refetchInterval: 60000,
  })

  const { data: extList } = useQuery({
    queryKey: ['extinguishers-recent'],
    queryFn: () => api.get('/api/extinguishers?limit=5&page=1').then((r) => r.data),
  })

  const ext = dash?.extinguishers || {}
  const insp = dash?.inspections || {}

  return (
    <div>
      <p className="breadcrumb">Command Center <span>›</span> Overview</p>
      <h1 className="page-title" style={{ marginBottom: '0.35rem' }}>
        Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.firstName}
      </h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
        {user?.role === 'user' && 'Your facility fire safety overview'}
        {user?.role === 'inspector' && 'Assigned inspections & equipment verification'}
        {user?.role === 'admin' && 'System-wide supervisory dashboard'}
      </p>

      {ext.expired > 0 && (
        <div className="alert alert-warning">
          <strong>{ext.expired} extinguisher{ext.expired > 1 ? 's' : ''} expired</strong> — schedule inspection or replacement.
        </div>
      )}

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card"><div className="stat-value" style={{ color: '#2563eb' }}>{ext.total ?? '—'}</div><div className="stat-label">Total Extinguishers</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: '#16a34a' }}>{ext.active ?? '—'}</div><div className="stat-label">Active</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: '#dc2626' }}>{ext.expired ?? '—'}</div><div className="stat-label">Expired</div></div>
          <div className="stat-card"><div className="stat-value" style={{ color: '#d97706' }}>{ext.expiringSoon ?? '—'}</div><div className="stat-label">Expiring (30d)</div></div>
          {user?.role === 'admin' && (
            <>
              <div className="stat-card"><div className="stat-value" style={{ color: '#7c3aed' }}>{insp.scheduled ?? '—'}</div><div className="stat-label">Inspections Due</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: '#16a34a' }}>{insp.completed ?? '—'}</div><div className="stat-label">Completed</div></div>
            </>
          )}
          {user?.role === 'user' && (
            <>
              <div className="stat-card"><div className="stat-value" style={{ color: '#7c3aed' }}>{insp.total ?? '—'}</div><div className="stat-label">My Inspections</div></div>
              <div className="stat-card"><div className="stat-value" style={{ color: '#16a34a' }}>{insp.completed ?? '—'}</div><div className="stat-label">Completed</div></div>
            </>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>Recent Equipment</h3>
            {extList?.data?.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No equipment yet</p>}
            {extList?.data?.map((e) => (
              <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => navigate(`/extinguishers/${e.id}`)}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{e.serialNumber}</div>
                  <div className="text-muted" style={{ fontSize: '0.78rem' }}>{e.location}</div>
                </div>
                <span className={statusBadgeClass(e.status)}>{e.status}</span>
              </div>
            ))}
            {user?.role === 'user' && (
              <button type="button" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} onClick={() => navigate('/register')}>
                + Register Equipment
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/extinguishers')}>View Inventory</button>
              <button type="button" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/inspections')}>Inspections</button>
              <button type="button" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/reports')}>Download Reports</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
