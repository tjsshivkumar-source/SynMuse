import { Link, useLocation } from 'react-router-dom'

const WORKSPACE_NAV = [
  { icon: '⊞', label: 'Home', path: '/' },
  { icon: '+', label: 'New Persona', path: '/create' },
  { icon: '⊕', label: 'New Panel', path: '/panel/linen' },
]

const RECENT_NAV = [
  { icon: '◯', label: 'Sophie — Trend-Forward', path: '/persona/sophie' },
  { icon: '◯', label: 'Jordan — Archive Collector', path: '/persona/jordan' },
  { icon: '◻', label: 'SS26 Linen Panel', path: '/panel/linen' },
  { icon: '◻', label: 'AW26 Denim Panel', path: '/panel/denim' },
]

const USER = { initials: 'TN', name: 'Tejas N.', email: 'tejas@brand.co' }

export default function Sidebar() {
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="w-[220px] min-w-[220px] bg-black-soft border-r border-border py-6 flex flex-col h-screen overflow-y-auto">
      <div className="text-base font-bold tracking-[2px] uppercase px-6 mb-9 text-text-primary">
        SYN<span className="font-normal text-text-muted">MUSE</span>
      </div>

      <div className="flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted px-6 mb-2 mt-7">
          Workspace
        </div>
        {WORKSPACE_NAV.map((item) => (
          <Link
            key={item.path + item.label}
            to={item.path}
            className={`flex items-center gap-2.5 py-2 px-6 text-[13px] font-medium cursor-pointer transition-all border-l-2 no-underline ${
              isActive(item.path)
                ? 'text-text-primary bg-surface-active border-l-white'
                : 'text-text-secondary border-l-transparent hover:text-text-primary hover:bg-surface'
            }`}
          >
            <span className="w-[18px] h-[18px] flex items-center justify-center text-sm text-text-muted">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}

        <div className="text-[10px] font-semibold uppercase tracking-[1.5px] text-text-muted px-6 mb-2 mt-7">
          Recent
        </div>
        {RECENT_NAV.map((item) => (
          <Link
            key={item.path + item.label}
            to={item.path}
            className={`flex items-center gap-2.5 py-2 px-6 text-[13px] font-medium cursor-pointer transition-all border-l-2 no-underline ${
              isActive(item.path)
                ? 'text-text-primary bg-surface-active border-l-white'
                : 'text-text-secondary border-l-transparent hover:text-text-primary hover:bg-surface'
            }`}
          >
            <span className="w-[18px] h-[18px] flex items-center justify-center text-sm text-text-muted">
              {item.icon}
            </span>
            {item.label}
          </Link>
        ))}
      </div>

      <div className="px-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center text-xs font-semibold text-text-secondary border border-border">
            {USER.initials}
          </div>
          <div>
            <div className="text-[13px] font-medium text-text-primary">{USER.name}</div>
            <div className="text-[11px] text-text-muted">{USER.email}</div>
          </div>
        </div>
      </div>
    </nav>
  )
}
