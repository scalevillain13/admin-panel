import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import {
  fetchUsers,
  fetchUser,
  createUser,
  updateUser,
  blockUser,
  type CreateUserInput,
  type UpdateUserInput,
} from '../api/users'
import { fetchRoles } from '../api/roles'
import { fetchUserGroups, setUserGroups } from '../api/userGroups'
import { fetchGroups } from '../api/groups'
import { logActivity } from '../api/activity'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

const createSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов'),
  full_name: z.string().optional(),
  role_id: z.string().uuid().optional().or(z.literal('')),
})
const editSchema = z.object({
  full_name: z.string().optional(),
  role_id: z.string().uuid().optional().or(z.literal('')),
  status: z.enum(['active', 'blocked', 'pending']),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

export default function Users() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [groupEditId, setGroupEditId] = useState<string | null>(null)

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', search, roleFilter, statusFilter],
    queryFn: () => fetchUsers({ search: search || undefined, role_id: roleFilter || undefined, status: statusFilter || undefined }),
  })
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: fetchRoles })
  const { data: editUserData } = useQuery({
    queryKey: ['user', editId],
    queryFn: () => fetchUser(editId!),
    enabled: !!editId,
  })
  const { data: userGroups } = useQuery({
    queryKey: ['userGroups', editId],
    queryFn: () => fetchUserGroups(editId!),
    enabled: !!editId,
  })

  const createMutation = useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: async (user) => {
      const { data: { user: me } } = await supabase.auth.getUser()
      await logActivity({ user_id: me?.id ?? null, action: 'create_user', entity_type: 'user', entity_id: user.id, payload: { email: user.email } })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setCreateOpen(false)
      toast.success('Пользователь создан')
    },
    onError: (err: Error) => toast.error(err.message),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => updateUser(id, input),
    onSuccess: async (_, { id }) => {
      const { data: { user: me } } = await supabase.auth.getUser()
      await logActivity({ user_id: me?.id ?? null, action: 'update_user', entity_type: 'user', entity_id: id })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', editId] })
      setEditId(null)
      toast.success('Сохранено')
    },
    onError: (err: Error) => toast.error(err.message),
  })
  const blockMutation = useMutation({
    mutationFn: (id: string) => blockUser(id),
    onSuccess: async (_, id) => {
      const { data: { user: me } } = await supabase.auth.getUser()
      await logActivity({ user_id: me?.id ?? null, action: 'block_user', entity_type: 'user', entity_id: id })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Пользователь заблокирован')
    },
    onError: (err: Error) => toast.error(err.message),
  })
  const groupsMutation = useMutation({
    mutationFn: ({ userId, groupIds }: { userId: string; groupIds: string[] }) => setUserGroups(userId, groupIds),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['userGroups', userId] })
      setGroupEditId(null)
      toast.success('Группы обновлены')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { email: '', password: '', full_name: '', role_id: '' },
  })
  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { full_name: '', role_id: '', status: 'active' },
  })

  if (editUserData && editForm.getValues('full_name') === '' && editUserData.full_name !== undefined) {
    editForm.reset({
      full_name: editUserData.full_name ?? '',
      role_id: editUserData.role_id ?? '',
      status: editUserData.status,
    })
  }

  const users = usersData?.data ?? []
  const count = usersData?.count ?? 0

  const columns = [
    { key: 'email', header: 'Email' },
    { key: 'full_name', header: 'Имя', render: (r: User) => r.full_name || '—' },
    { key: 'role', header: 'Роль', render: (r: User) => r.role?.name ?? '—' },
    { key: 'status', header: 'Статус', render: (r: User) => <StatusBadge status={r.status} /> },
    { key: 'created_at', header: 'Создан', render: (r: User) => new Date(r.created_at).toLocaleDateString('ru') },
    {
      key: 'actions',
      header: 'Действия',
      render: (r: User) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditId(r.id)}
            className="text-primary-600 hover:underline"
          >
            Изменить
          </button>
          <button
            type="button"
            onClick={() => setGroupEditId(r.id)}
            className="text-primary-600 hover:underline"
          >
            Группы
          </button>
          {r.status === 'active' && (
            <button
              type="button"
              onClick={() => window.confirm('Заблокировать?') && blockMutation.mutate(r.id)}
              className="text-red-600 hover:underline"
            >
              Блок
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Пользователи</h1>
          <p className="mt-1 text-slate-600">Создание, редактирование, блокировка и назначение ролей</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
        >
          Добавить пользователя
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Поиск по email или имени..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Все роли</option>
          {roles?.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        >
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="blocked">Заблокированные</option>
          <option value="pending">Ожидание</option>
        </select>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={users}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
          emptyMessage="Нет пользователей"
        />
        {count > 0 && <p className="mt-2 text-sm text-slate-500">Всего: {count}</p>}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Создать пользователя">
        <form
          onSubmit={createForm.handleSubmit((d) =>
            createMutation.mutate({
              email: d.email,
              password: d.password,
              full_name: d.full_name || undefined,
              role_id: d.role_id || undefined,
            })
          )}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input {...createForm.register('email')} type="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            {createForm.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Пароль</label>
            <input {...createForm.register('password')} type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            {createForm.formState.errors.password && (
              <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Имя</label>
            <input {...createForm.register('full_name')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Роль</label>
            <select {...createForm.register('role_id')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="">—</option>
              {roles?.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">
              Отмена
            </button>
            <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-primary-700 px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50">
              Создать
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editId} onClose={() => setEditId(null)} title="Редактировать пользователя">
        {editUserData && (
          <form
            onSubmit={editForm.handleSubmit((d) =>
              updateMutation.mutate({
                id: editId!,
                input: {
                  full_name: d.full_name || undefined,
                  role_id: d.role_id || undefined,
                  status: d.status,
                },
              })
            )}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <p className="mt-1 text-slate-900">{editUserData.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Имя</label>
              <input {...editForm.register('full_name')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Роль</label>
              <select {...editForm.register('role_id')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="">—</option>
                {roles?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Статус</label>
              <select {...editForm.register('status')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">
                <option value="active">Активный</option>
                <option value="blocked">Заблокирован</option>
                <option value="pending">Ожидание</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditId(null)} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">Отмена</button>
              <button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-primary-700 px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50">Сохранить</button>
            </div>
          </form>
        )}
      </Modal>

      {groupEditId && (
        <GroupEditModal
          userId={groupEditId}
          userGroups={userGroups ?? []}
          onSave={(groupIds) => groupsMutation.mutate({ userId: groupEditId, groupIds })}
          onClose={() => setGroupEditId(null)}
          isPending={groupsMutation.isPending}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: User['status'] }) {
  const map = { active: 'Активен', blocked: 'Заблокирован', pending: 'Ожидание' }
  const colors = { active: 'bg-green-100 text-green-800', blocked: 'bg-red-100 text-red-800', pending: 'bg-amber-100 text-amber-800' }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status]}`}>
      {map[status]}
    </span>
  )
}

function GroupEditModal({
  userGroups,
  onSave,
  onClose,
  isPending,
}: {
  userId: string
  userGroups: { id: string; name: string }[]
  onSave: (groupIds: string[]) => void
  onClose: () => void
  isPending: boolean
}) {
  const [selected, setSelected] = useState<string[]>(() => userGroups.map((g) => g.id))
  const { data: groups } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })

  useEffect(() => {
    setSelected(userGroups.map((g) => g.id))
  }, [userGroups])

  return (
    <Modal open onClose={onClose} title="Группы пользователя">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Отметьте группы, в которые входит пользователь.</p>
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {groups?.map((g) => (
            <label key={g.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(g.id)}
                onChange={(e) =>
                  setSelected((prev) => (e.target.checked ? [...prev, g.id] : prev.filter((id) => id !== g.id)))
                }
              />
              <span>{g.name}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">Отмена</button>
          <button
            type="button"
            onClick={() => onSave(selected)}
            disabled={isPending}
            className="rounded-lg bg-primary-700 px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>
      </div>
    </Modal>
  )
}
