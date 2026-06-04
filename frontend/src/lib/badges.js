export function statusBadgeClass(status) {
  const map = {
    active: 'badge-active',
    expired: 'badge-expired',
    maintenance: 'badge-maintenance',
    scheduled: 'badge-scheduled',
    completed: 'badge-completed',
    passed: 'badge-completed',
    failed: 'badge-expired',
  }
  return `badge ${map[status] || 'badge-default'}`
}
