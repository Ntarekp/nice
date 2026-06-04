import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { statusBadgeClass } from '../lib/badges'

const STATUS_COLORS = {
  scheduled: '#3498db',
  in_progress: '#f39c12',
  completed: '#27ae60',
  missed: '#e74c3c',
  cancelled: '#95a5a6',
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'

  const { data: dash, isLoading } = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: () => api.get('/api/reports/dashboard').then((r) => r.data),
    refetchInterval: 60000,
  })

  const { data: extList } = useQuery({
    queryKey: ['extinguishers-recent'],
    queryFn: () => api.get('/api/extinguishers', { params: { limit: 5, page: 1 } }).then((r) => r.data),
  })

  const { data: pendingInspections } = useQuery({
    queryKey: ['inspections-pending-assign'],
    queryFn: () =>
      api
        .get('/api/inspections', {
          params: { unassigned: true, limit: 8, page: 1 },
        })
        .then((r) => r.data),
    enabled: isAdmin,
  })

  const { data: allExtinguishers } = useQuery({
    queryKey: ['extinguishers-map'],
    queryFn: () => api.get('/api/extinguishers', { params: { limit: 100, page: 1 } }).then((r) => r.data),
    enabled: isAdmin,
  })

  const extMap = Object.fromEntries((allExtinguishers?.data || []).map((e) => [e.id, e]))

  const ext = dash?.extinguishers || {}
  const insp = dash?.inspections || {}

  return (
    <div>
      <p className="breadcrumb">
        Command Center <span>›</span> Overview
      </p>
      <h1 className="page-title" style={{ marginBottom: '0.35rem' }}>
        Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.firstName}
      </h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
        {user?.role === 'user' && 'Track your equipment and inspection requests'}
        {user?.role === 'inspector' && 'Your assigned inspections and field work'}
        {user?.role === 'admin' && 'Assign inspectors to scheduled requests and monitor status'}
      </p>

      {ext.expired > 0 && (
        <div className="alert alert-warning">
          <strong>
            {ext.expired} extinguisher{ext.expired > 1 ? 's' : ''} expired
          </strong>{' '}
          — schedule inspection or replacement.
        </div>
      )}

      {isAdmin && insp.pendingAssignment > 0 && (
        <div className="alert alert-warning">
          <strong>
            {insp.pendingAssignment} inspection{insp.pendingAssignment > 1 ? 's' : ''} awaiting
            inspector assignment
          </strong>{' '}
          — assign below or on the Inspections page.
        </div>
      )}

      {isLoading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#2563eb' }}>
              {ext.total ?? '—'}
            </div>
            <div className="stat-label">Total Extinguishers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#16a34a' }}>
              {ext.active ?? '—'}
            </div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#dc2626' }}>
              {ext.expired ?? '—'}
            </div>
            <div className="stat-label">Expired</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#d97706' }}>
              {ext.expiringSoon ?? '—'}
            </div>
            <div className="stat-label">Expiring (30d)</div>
          </div>
          {isAdmin && (
            <>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#7c3aed' }}>
                  {insp.scheduled ?? '—'}
                </div>
                <div className="stat-label">Scheduled</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#ea580c' }}>
                  {insp.pendingAssignment ?? '—'}
                </div>
                <div className="stat-label">Needs Assignment</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#f39c12' }}>
                  {insp.inProgress ?? '—'}
                </div>
                <div className="stat-label">In Progress</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#16a34a' }}>
                  {insp.completed ?? '—'}
                </div>
                <div className="stat-label">Completed</div>
              </div>
            </>
          )}
          {user?.role === 'user' && (
            <>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#7c3aed' }}>
                  {insp.total ?? '—'}
                </div>
                <div className="stat-label">My Requests</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#f39c12' }}>
                  {insp.scheduled ?? '—'}
                </div>
                <div className="stat-label">Scheduled</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#16a34a' }}>
                  {insp.completed ?? '—'}
                </div>
                <div className="stat-label">Completed</div>
              </div>
            </>
          )}
          {user?.role === 'inspector' && (
            <>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#7c3aed' }}>
                  {insp.scheduled ?? '—'}
                </div>
                <div className="stat-label">Assigned (scheduled)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: '#16a34a' }}>
                  {insp.completed ?? '—'}
                </div>
                <div className="stat-label">Completed</div>
              </div>
            </>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        {isAdmin && (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="card-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h3 style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Scheduled inspections — assign inspector
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/inspections')}
                >
                  Manage all →
                </button>
              </div>
              {!pendingInspections?.data?.length ? (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                  No unassigned scheduled inspections.
                </p>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        {['Equipment', 'Scheduled', 'Type', 'Status', ''].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingInspections.data.map((ins) => (
                        <tr key={ins.id}>
                          <td>
                            <strong>{extMap[ins.extinguisherId]?.serialNumber || '—'}</strong>
                            <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                              {extMap[ins.extinguisherId]?.location || ins.extinguisherId?.slice(0, 8)}
                            </div>
                          </td>
                          <td>{new Date(ins.scheduledDate).toLocaleString()}</td>
                          <td style={{ textTransform: 'capitalize' }}>
                            {ins.type?.replace(/_/g, ' ')}
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '20px',
                                fontSize: '0.72rem',
                                background: `${STATUS_COLORS.scheduled}22`,
                                color: STATUS_COLORS.scheduled,
                              }}
                            >
                              awaiting assignment
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                              onClick={() => navigate('/inspections')}
                            >
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
              Recent Equipment
            </h3>
            {extList?.data?.length === 0 && (
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                No equipment yet
              </p>
            )}
            {extList?.data?.map((e) => (
              <div
                key={e.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/extinguishers/${e.id}`)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{e.serialNumber}</div>
                  <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                    {e.location}
                  </div>
                </div>
                <span className={statusBadgeClass(e.status)}>{e.status}</span>
              </div>
            ))}
            {user?.role === 'user' && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginTop: '1rem', width: '100%' }}
                onClick={() => navigate('/register')}
              >
                + Register Equipment
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => navigate('/extinguishers')}
              >
                View Inventory
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => navigate('/inspections')}
              >
                Inspections
              </button>
              {user?.role === 'user' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate('/inspections')}
                >
                  Request Inspection
                </button>
              )}
              {(user?.role === 'admin' || user?.role === 'inspector') && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start' }}
                  onClick={() => navigate('/reports')}
                >
                  Download Reports
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
