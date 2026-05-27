import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  { label: 'Dashboard', icon: 'ti-layout-dashboard', to: '/' },
  { label: 'Clients', icon: 'ti-users', to: '/clients' },
  { label: 'Invoices', icon: 'ti-file-invoice', to: '/invoices' },
  { label: 'Products', icon: 'ti-package', to: '/products' },
]

const adminNav = [
  { label: 'Users', icon: 'ti-shield-lock', to: '/users' },
  { label: 'Settings', icon: 'ti-settings', to: '/settings' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive ? 'bg-indigo-500/20 text-indigo-300' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
    }`

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-52 bg-[#1a1f2e] flex flex-col flex-shrink-0">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-white font-medium text-sm">SupplyDesk</div>
          <div className="text-white/30 text-xs mt-0.5">General Supplies</div>
        </div>

        <nav className="flex-1 p-2.5 space-y-0.5">
          <div className="text-[10px] text-white/30 uppercase tracking-wider px-3 py-2">Main</div>
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>
              <i className={`ti ${item.icon} text-base`} />
              {item.label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <>
              <div className="text-[10px] text-white/30 uppercase tracking-wider px-3 py-2 mt-2">Admin</div>
              {adminNav.map(item => (
                <NavLink key={item.to} to={item.to} className={linkClass}>
                  <i className={`ti ${item.icon} text-base`} />
                  {item.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="px-3.5 py-3 border-t border-white/10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white/80 text-xs font-medium truncate">{user?.name}</div>
            <div className="text-white/30 text-[10px] capitalize">{user?.role}</div>
          </div>
          <button onClick={handleLogout} title="Sign out">
            <i className="ti ti-logout text-white/30 hover:text-white/60 text-sm" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
