import { useQuery } from '@tanstack/react-query'
import DataTable from '../components/DataTable'
import { fetchPermissions } from '../api/roles'
import type { Permission } from '../types'

export default function PermissionsPage() {
  const { data: permissions = [], isLoading } = useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions })

  const byCategory = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const cat = p.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  const columns = [
    { key: 'code', header: 'Код' },
    { key: 'name', header: 'Название' },
    { key: 'category', header: 'Категория', render: (r: Permission) => r.category || '—' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Права доступа</h1>
      <p className="mt-1 text-slate-600">Справочник разрешений по категориям</p>

      <div className="mt-6 space-y-6">
        {Object.entries(byCategory).map(([cat, perms]) => (
          <div key={cat}>
            <h2 className="mb-2 text-sm font-medium uppercase text-slate-500">{cat}</h2>
            <DataTable
              columns={columns}
              data={perms}
              keyExtractor={(r) => r.id}
              isLoading={isLoading}
              emptyMessage="Нет прав"
            />
          </div>
        ))}
        {Object.keys(byCategory).length === 0 && !isLoading && (
          <p className="text-slate-500">Нет данных о правах</p>
        )}
      </div>
    </div>
  )
}
