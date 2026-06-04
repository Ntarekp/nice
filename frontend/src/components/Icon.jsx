import {
  LayoutDashboard,
  Package,
  ClipboardPlus,
  Search,
  Wrench,
  FileDown,
  Users,
  Settings,
  Bell,
  LogOut,
  Shield,
  Plus,
  ChevronRight,
  Flame,
} from 'lucide-react'

const MAP = {
  dashboard: LayoutDashboard,
  inventory: Package,
  registrations: ClipboardPlus,
  inspections: Search,
  maintenance: Wrench,
  reports: FileDown,
  users: Users,
  settings: Settings,
  bell: Bell,
  logout: LogOut,
  shield: Shield,
  plus: Plus,
  chevron: ChevronRight,
  flame: Flame,
}

export default function Icon({ name, size = 18, className = '', strokeWidth = 2 }) {
  const LucideIcon = MAP[name] || Package
  return (
    <LucideIcon
      size={size}
      strokeWidth={strokeWidth}
      className={className || 'icon-inline'}
      aria-hidden
    />
  )
}
