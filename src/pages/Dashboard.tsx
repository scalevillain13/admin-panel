import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchUsers } from '../api/users'
import { fetchGroups } from '../api/groups'
import { fetchRoles } from '../api/roles'
import { fetchActivityLogs } from '../api/activity'
import type { ActivityLog } from '../types'

const ACTION_LABELS: Record<string, string> = {
  create_user: 'Создание пользователя',
  update_user: 'Изменение пользователя',
  block_user: 'Блокировка пользователя',
  create_group: 'Создание группы',
  update_group: 'Изменение группы',
  delete_group: 'Удаление группы',
  assign_role: 'Назначение роли',
  login: 'Вход',
  logout: 'Выход',
}

export default function Dashboard() {
  const { data: usersData } = useQuery({ queryKey: ['users', '', '', ''], queryFn: () => fetchUsers({}) })
  const { data: groups = [] } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: fetchRoles })
  const { data: activityData } = useQuery({
    queryKey: ['activity', 1, {}],
    queryFn: () => fetchActivityLogs({ page: 1, pageSize: 10 }),
  })

  const userCount = usersData?.count ?? 0
  const activeCount = usersData?.data?.filter((u) => u.status === 'active').length ?? 0
  const recentActivity = activityData?.data ?? []

  const cards = [
    { to: '/users', label: 'Пользователи', value: userCount, sub: `Активных: ${activeCount}` },
    { to: '/groups', label: 'Группы', value: groups.length },
    { to: '/roles', label: 'Роли', value: roles.length },
    { to: '/activity', label: 'Активность', value: activityData?.count ?? 0, sub: 'всего записей' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Дашборд</h1>
      <p className="mt-2 text-slate-600">Сводка по пользователям, группам и последним действиям</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ to, label, value, sub }) => (
          <Link
            key={to}
            to={to}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
            {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium text-slate-900">Последние действия</h2>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {recentActivity.length === 0 ? (
            <p className="p-6 text-slate-500">Нет записей</p>
          ) : (
            <ul className="divide-y divide-slate-200">
              {recentActivity.map((r: ActivityLog) => (
                <li key={r.id} className="flex items-center justify-between px-6 py-3 text-sm">
                  <span className="text-slate-600">
                    {r.user && typeof r.user === 'object' && 'email' in r.user ? r.user.email : '—'} — {ACTION_LABELS[r.action] ?? r.action}
                  </span>
                  <span className="text-slate-400">{new Date(r.created_at).toLocaleString('ru')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link to="/activity" className="mt-2 inline-block text-sm text-primary-600 hover:underline">
          Весь лог →
        </Link>
      </div>
    </div>
  )
}
