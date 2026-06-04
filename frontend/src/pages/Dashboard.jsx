import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'

const StatCard = ({ icon, label, value, color = '#3498db', sub }) => (
  <div style={{
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: '1.2rem',
    borderTop: `3px solid ${color}`
  }}>
    <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
    <div style={{ fontSize: '1.8rem', fontWeight: 700, color }}>{value ?? '—'}</div>
    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{label}</div>
    {sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', marginTop: '0.3rem' }}>{sub}</div>}
  </div>
)

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data: report, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/reports/dashboard').then(r => r.data),
    refetchInterval: 60000
  })

  const { data: extList } = useQuery({
    queryKey: ['extinguishers-recent'],
    queryFn: () => api.get('/api/extinguishers?limit=5&page=1').then(r => r.data)
  })

  if (isLoading) return <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Loading dashboard...</div>

  const ext = report?.extinguishers || {}
  const insp = report?.inspections || {}

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 600 }}>
          Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.firstName} 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
          Here's your fire safety overview — {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alert banner for expired */}
      {ext.expired > 0 && (
        <div style={{
          background: 'rgba(231,76,60,0.12)', border: '1px solid rgba(231,76,60,0.3)',
          borderRadius: 'var(--radius)', padding: '0.75rem 1rem', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e74c3c', fontSize: '0.9rem'
        }}>
          ⚠️ <strong>{ext.expired} extinguisher{ext.expired > 1 ? 's' : ''} expired</strong> — immediate action required
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon="🧯" label="Total Extinguishers" value={ext.total} color="#3498db" />
        <StatCard icon="✅" label="Active" value={ext.active} color="#27ae60" />
        <StatCard icon="❌" label="Expired" value={ext.expired} color="#e74c3c" />
        <StatCard icon="🔧" label="In Maintenance" value={ext.maintenance} color="#f39c12" />
        <StatCard icon="⏰" label="Expiring Soon" value={ext.expiringSoon} color="#e67e22" sub="Within 30 days" />
        <StatCard icon="🔍" label="Inspections Due" value={insp.scheduled} color="#9b59b6" />
        <StatCard icon="✔️" label="Completed" value={insp.completed} color="#1abc9c" sub="All time" />
        <StatCard icon="📅" label="This Month" value={insp.thisMonth} color="#3498db" sub="Inspections" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>🧯 Recent Extinguishers</h3>
          {extList?.data?.map(e => (
            <div key={e.id} style={styles.listItem}>
              <div>
                <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{e.serialNumber}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{e.location}</div>
              </div>
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 500,
                background: e.status === 'active' ? 'rgba(39,174,96,0.15)' : e.status === 'expired' ? 'rgba(231,76,60,0.15)' : 'rgba(243,156,18,0.15)',
                color: e.status === 'active' ? '#27ae60' : e.status === 'expired' ? '#e74c3c' : '#f39c12'
              }}>{e.status}</span>
            </div>
          ))}
        </div>

        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>📊 By Type</h3>
          {(ext.byType || []).map(({ type, count }) => (
            <div key={type} style={styles.listItem}>
              <span style={{ textTransform: 'capitalize', fontSize: '0.9rem' }}>
                {type?.replace(/_/g, ' ')}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  height: '6px', borderRadius: '3px', background: 'var(--color-primary)',
                  width: `${Math.min((count / (ext.total || 1)) * 100, 100)}px`
                }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  panel: {
    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)', padding: '1.2rem'
  },
  panelTitle: { fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' },
  listItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)'
  }
}
