import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MaterialIcon from './MaterialIcon'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth.store'

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState({ extinguishers: [], users: [], serial: null })
  const wrapRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults({ extinguishers: [], users: [], serial: null })
      return undefined
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const tasks = [
          api.get('/api/extinguishers', { params: { search: q, limit: 6, page: 1 } }),
        ]
        if (user?.role === 'admin') {
          tasks.push(api.get('/api/users', { params: { search: q, limit: 5, page: 1 } }))
        }
        if (user?.role === 'inspector' || user?.role === 'admin') {
          tasks.push(
            api
              .get(`/api/extinguishers/lookup/${encodeURIComponent(q)}`)
              .then((r) => ({ data: r.data, serial: true }))
              .catch(() => ({ data: null, serial: true }))
          )
        }

        const settled = await Promise.all(tasks)
        const extRes = settled[0]?.data
        let users = []
        let serial = null

        if (user?.role === 'admin' && settled[1]) {
          users = settled[1].data?.data || []
          const serialRes = settled[2]
          if (serialRes?.data && serialRes.serial) serial = serialRes.data
        } else if ((user?.role === 'inspector') && settled[1]) {
          const serialRes = settled[1]
          if (serialRes?.data && serialRes.serial) serial = serialRes.data
        }

        setResults({
          extinguishers: extRes?.data || [],
          users,
          serial,
        })
        setOpen(true)
      } catch {
        setResults({ extinguishers: [], users: [], serial: null })
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, user?.role])

  const go = (path) => {
    setOpen(false)
    setQuery('')
    navigate(path)
  }

  const hasResults =
    results.serial ||
    results.extinguishers.length > 0 ||
    results.users.length > 0

  return (
    <div className="global-search-wrap" ref={wrapRef}>
      <MaterialIcon name="search" size={18} className="global-search-icon" />
      <input
        type="search"
        className="global-search-input"
        placeholder="Search equipment, serial, users…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        aria-label="Global search"
      />
      {open && query.trim().length >= 2 && (
        <div className="search-dropdown">
          {loading && (
            <p className="p-4 text-sm text-text-secondary">
              Searching…
            </p>
          )}
          {!loading && !hasResults && (
            <p className="p-4 text-sm text-text-secondary">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
          {!loading && results.serial && (
            <>
              <div className="search-group-title">Exact serial match</div>
              <button
                type="button"
                className="search-result-item"
                onClick={() => go(`/extinguishers/${results.serial.id}`)}
              >
                {results.serial.serialNumber} — {results.serial.location}
              </button>
            </>
          )}
          {!loading && results.extinguishers.length > 0 && (
            <>
              <div className="search-group-title">Inventory</div>
              {results.extinguishers.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  className="search-result-item"
                  onClick={() => go(`/extinguishers/${e.id}`)}
                >
                  {e.serialNumber} — {e.location}
                </button>
              ))}
            </>
          )}
          {!loading && results.users.length > 0 && (
            <>
              <div className="search-group-title">Users</div>
              {results.users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="search-result-item"
                  onClick={() => go('/users')}
                >
                  {u.firstName} {u.lastName} ({u.email})
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
