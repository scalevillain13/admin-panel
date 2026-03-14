import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import {
  fetchRoles,
  fetchRole,
  fetchPermissions,
  createRole,
  updateRole,
  deleteRole,
  updateRolePermissions,
} from '../api/roles'
import type { Role, Permission } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [permsId, setPermsId] = useState<string | null>(null)

  const { data: roles = [], isLoading } = useQuery({ queryKey: ['roles'], queryFn: fetchRoles })
  const { data: permissions = [] } = useQuery({ queryKey: ['permissions'], queryFn: fetchPermissions })
  const { data: roleDetail } = useQuery({
    queryKey: ['role', editId],
    queryFn: () => fetchRole(editId!),
    enabled: !!editId,
  })
  const { data: rolePermsDetail } = useQuery({
    queryKey: ['role', permsId],
    queryFn: () => fetchRole(permsId!),
    enabled: !!permsId,
  })

  const createForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', description: '' } })
  const editForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', description: '' } })

  if (roleDetail && editForm.getValues('name') !== roleDetail.name) {
    editForm.reset({ name: roleDetail.name, description: roleDetail.description ?? '' })
  }

  const createMutation = useMutation({
    mutationFn: (input: { name: string; description?: string }) => createRole(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setCreateOpen(false)
      createForm.reset()
      toast.success('Роль создана')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name?: string; description?: string } }) => updateRole(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setEditId(null)
      toast.success('Сохранено')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Роль удалена')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const permsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) => updateRolePermissions(roleId, permissionIds),
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: ['role', roleId] })
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      setPermsId(null)
      toast.success('Права обновлены')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns = [
    { key: 'name', header: 'Название' },
    { key: 'description', header: 'Описание', render: (r: Role) => r.description || '—' },
    {
      key: 'actions',
      header: 'Действия',
      render: (r: Role) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditId(r.id)} className="text-primary-600 hover:underline">Изменить</button>
          <button type="button" onClick={() => setPermsId(r.id)} className="text-primary-600 hover:underline">Права</button>
          <button type="button" onClick={() => window.confirm('Удалить роль?') && deleteMutation.mutate(r.id)} className="text-red-600 hover:underline">Удалить</button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Роли</h1>
          <p className="mt-1 text-slate-600">Управление ролями и привязка прав</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
        >
          Создать роль
        </button>
      </div>

      <div className="mt-6">
        <DataTable columns={columns} data={roles} keyExtractor={(r) => r.id} isLoading={isLoading} emptyMessage="Нет ролей" />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Создать роль">
        <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Название</label>
            <input {...createForm.register('name')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            {createForm.formState.errors.name && <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Описание</label>
            <input {...createForm.register('description')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">Отмена</button>
            <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-primary-700 px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50">Создать</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editId} onClose={() => setEditId(null)} title="Редактировать роль">
        {roleDetail && (
          <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate({ id: editId!, input: d }))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Название</label>
              <input {...editForm.register('name')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              {editForm.formState.errors.name && <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Описание</label>
              <input {...editForm.register('description')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditId(null)} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">Отмена</button>
              <button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-primary-700 px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50">Сохранить</button>
            </div>
          </form>
        )}
      </Modal>

      {permsId && rolePermsDetail && (
        <PermissionsModal
          roleId={permsId}
          roleName={rolePermsDetail.name}
          permissions={permissions}
          selectedIds={(rolePermsDetail.role_permissions ?? []).map((rp: { permission_id: string }) => rp.permission_id)}
          onSave={(ids) => permsMutation.mutate({ roleId: permsId, permissionIds: ids })}
          onClose={() => setPermsId(null)}
          isPending={permsMutation.isPending}
        />
      )}
    </div>
  )
}

function PermissionsModal({
  roleName,
  permissions,
  selectedIds,
  onSave,
  onClose,
  isPending,
}: {
  roleId: string
  roleName: string
  permissions: Permission[]
  selectedIds: string[]
  onSave: (ids: string[]) => void
  onClose: () => void
  isPending: boolean
}) {
  const [selected, setSelected] = useState<string[]>(selectedIds)
  useEffect(() => setSelected(selectedIds), [selectedIds])

  const byCategory = permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    const cat = p.category ?? 'other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(p)
    return acc
  }, {})

  return (
    <Modal open onClose={onClose} title={`Права: ${roleName}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Отметьте разрешения для роли</p>
        <div className="max-h-72 space-y-4 overflow-y-auto">
          {Object.entries(byCategory).map(([cat, perms]) => (
            <div key={cat}>
              <p className="text-xs font-medium uppercase text-slate-500">{cat}</p>
              <div className="mt-1 space-y-1">
                {perms.map((p) => (
                  <label key={p.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={(e) =>
                        setSelected((prev) => (e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)))
                      }
                    />
                    <span className="text-sm">{p.name}</span>
                    <span className="text-xs text-slate-400">({p.code})</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">Отмена</button>
          <button type="button" onClick={() => onSave(selected)} disabled={isPending} className="rounded-lg bg-primary-700 px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50">Сохранить</button>
        </div>
      </div>
    </Modal>
  )
}
