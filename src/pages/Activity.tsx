import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DataTable from '../components/DataTable'
import { fetchActivityLogs, type ActivityFilters } from '../api/activity'
import type { ActivityLog } from '../types'

const ACTION_LABELS: Record<string, string> = {
  create_user: 'Создание пользователя',
  update_user: 'Изменение пользователя',
  delete_user: 'Удаление пользователя',
  block_user: 'Блокировка пользователя',
  create_group: 'Создание группы',
  update_group: 'Изменение группы',
  delete_group: 'Удаление группы',
  assign_role: 'Назначение роли',
  assign_group: 'Добавление в группу',
  remove_group: 'Удаление из группы',
  login: 'Вход',
  logout: 'Выход',
}

function formatDate(s: string) {
  const d = new Date(s)
  return d.toLocaleString('ru', { dateStyle: 'short', timeStyle: 'medium' })
}

export default function ActivityPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<ActivityFilters>({})
  const pageSize = 20

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page, filters],
    queryFn: () => fetchActivityLogs({ page, pageSize, ...filters }),
  })

  const list = data?.data ?? []
  const count = data?.count ?? 0
  const totalPages = Math.ceil(count / pageSize)

  const columns = [
    {
      key: 'created_at',
      header: 'Дата',
      render: (r: ActivityLog) => formatDate(r.created_at),
    },
    {
      key: 'user',
      header: 'Пользователь',
      render: (r: ActivityLog) => (r.user ? (typeof r.user === 'object' && 'email' in r.user ? r.user.email : '') : '—'),
    },
    {
      key: 'action',
      header: 'Действие',
      render: (r: ActivityLog) => ACTION_LABELS[r.action] ?? r.action,
    },
    {
      key: 'entity_type',
      header: 'Сущность',
      render: (r: ActivityLog) => [r.entity_type, r.entity_id].filter(Boolean).join(' ') || '—',
    },
    {
      key: 'payload',
      header: 'Детали',
      render: (r: ActivityLog) => (r.payload ? JSON.stringify(r.payload) : '—'),
    },
  ]

  const exportCsv = () => {
    const headers = ['Дата', 'Пользователь', 'Действие', 'Сущность', 'Детали']
    const rows = list.map((r: ActivityLog) => [
      formatDate(r.created_at),
      (r.user && typeof r.user === 'object' && 'email' in r.user ? r.user.email : '') ?? '',
      ACTION_LABELS[r.action] ?? r.action,
      [r.entity_type, r.entity_id].filter(Boolean).join(' ') || '',
      r.payload ? JSON.stringify(r.payload) : '',
    ])
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `activity-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Активность</h1>
          <p className="mt-1 text-slate-600">Лог действий пользователей</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={list.length === 0}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Экспорт CSV
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Действие..."
          value={filters.action ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value || undefined }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <select
          value={filters.entity_type ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, entity_type: e.target.value || undefined }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Все сущности</option>
          <option value="user">user</option>
          <option value="group">group</option>
          <option value="role">role</option>
        </select>
        <input
          type="date"
          value={filters.from?.slice(0, 10) ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value ? e.target.value + 'T00:00:00' : undefined }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={filters.to?.slice(0, 10) ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value ? e.target.value + 'T23:59:59' : undefined }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={list}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
          emptyMessage="Нет записей"
        />
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Страница {page} из {totalPages}, всего записей: {count}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-50"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded border border-slate-300 bg-white px-3 py-1 text-sm disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
