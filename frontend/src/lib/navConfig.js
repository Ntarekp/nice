/** Sidebar navigation — icon = Material Symbols name */
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'inspector', 'user'] },
  { to: '/extinguishers', label: 'Inventory', icon: 'inventory_2', roles: ['admin', 'inspector', 'user'] },
  { to: '/register', label: 'Registrations', icon: 'app_registration', roles: ['user'] },
  { to: '/inspections', label: 'Inspections', icon: 'fact_check', roles: ['admin', 'inspector', 'user'] },
  { to: '/maintenance', label: 'Maintenance', icon: 'engineering', roles: ['admin', 'inspector'] },
  { to: '/reports', label: 'Reports', icon: 'analytics', roles: ['admin', 'inspector', 'user'] },
  { to: '/users', label: 'Users', icon: 'group', roles: ['admin'] },
]

export const REPORT_TYPES_BY_ROLE = {
  admin: [
    { type: 'extinguishers', label: 'Extinguishers', desc: 'All facilities — equipment register' },
    { type: 'inspections', label: 'Inspections', desc: 'System-wide inspection history' },
    { type: 'maintenance', label: 'Maintenance', desc: 'All maintenance logs' },
  ],
  inspector: [
    { type: 'inspections', label: 'Inspections', desc: 'Your assigned inspections' },
    { type: 'maintenance', label: 'Maintenance', desc: 'Maintenance you have logged' },
    { type: 'extinguishers', label: 'Extinguishers', desc: 'Equipment you may inspect' },
  ],
  user: [
    { type: 'extinguishers', label: 'My Extinguishers', desc: 'Your facility equipment' },
    { type: 'inspections', label: 'My Inspections', desc: 'Inspection requests and status' },
  ],
}
