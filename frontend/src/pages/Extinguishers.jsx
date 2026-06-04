import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'
import { statusBadgeClass } from '../lib/badges'

export default function ExtinguishersPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [page, setPage] = useState(1)
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const canCreate = user?.role === 'user'
  const isReadOnly = user?.role === 'admin'

  const { data, isLoading } = useQuery({
    queryKey: ['extinguishers', page, search, filterStatus, filterType],
    queryFn: () =>
      api
        .get('/api/extinguishers', {
          params: {
            page,
            limit: 15,
            search: search || undefined,
            status: filterStatus || undefined,
            type: filterType || undefined,
          },
        })
        .then((r) => r.data),
  })

  return (
    <div>
      <p className="breadcrumb">Inventory <span>›</span> Equipment List</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="text-muted">
            {data?.pagination?.total ?? 0} registered
            {isReadOnly && ' · read-only (admin)'}
            {user?.role === 'user' && ' · your facility only'}
          </p>
        </div>
        {canCreate && (
          <Link to="/register" className="btn btn-primary">
            + Register Equipment
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Search serial, location…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          style={{ maxWidth: '280px' }}
        />
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '140px' }}>
          <option value="">All Status</option>
          {['active', 'expired', 'maintenance', 'decommissioned', 'missing'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '140px' }}>
          <option value="">All Types</option>
          {['water', 'co2', 'foam', 'dry_chemical', 'wet_chemical', 'halon'].map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {['Serial', 'Location', 'Type', 'Size', 'Expiry', 'Status', ''].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">Loading…</td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">No extinguishers found</td></tr>
            ) : (
              data.data.map((ext) => (
                <tr key={ext.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.82rem' }}>{ext.serialNumber}</td>
                  <td>
                    <div>{ext.location}</div>
                    {ext.building && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{ext.building}</div>}
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{ext.type?.replace(/_/g, ' ')}</td>
                  <td>{ext.size}</td>
                  <td style={{ color: new Date(ext.expiryDate) < new Date() ? 'var(--color-danger)' : 'inherit' }}>
                    {ext.expiryDate}
                  </td>
                  <td><span className={statusBadgeClass(ext.status)}>{ext.status}</span></td>
                  <td>
                    <button type="button" className="btn btn-ghost" onClick={() => navigate(`/extinguishers/${ext.id}`)}>View →</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.pagination?.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>←</button>
          <span className="text-muted" style={{ padding: '0.5rem' }}>{page} / {data.pagination.totalPages}</span>
          <button type="button" className="btn btn-secondary" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>→</button>
        </div>
      )}
    </div>
  )
}
