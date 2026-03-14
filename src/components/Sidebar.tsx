import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const nav = [
  { to: '/dashboard', label: 'Дашборд', icon: '📊' },
  { to: '/users', label: 'Пользователи', icon: '👤' },
  { to: '/groups', label: 'Группы', icon: '👥' },
  { to: '/roles', label: 'Роли', icon: '🔐' },
  { to: '/permissions', label: 'Права доступа', icon: '🛡️' },
  { to: '/activity', label: 'Активность', icon: '📋' },
]

export default function Sidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-4 z-50 rounded-lg bg-primary-800 p-2 text-white lg:hidden"
        onClick={() => setOpen((o) => !o)}
        aria-label="Меню"
      >
        <span className="text-xl">{open ? '✕' : '☰'}</span>
      </button>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <span className="text-lg font-semibold text-primary-900">Админ-панель</span>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-800'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
