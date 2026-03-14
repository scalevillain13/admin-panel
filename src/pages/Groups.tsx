import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import DataTable from '../components/DataTable'
import Modal from '../components/Modal'
import {
  fetchGroups,
  fetchGroup,
  fetchGroupMembers,
  createGroup,
  updateGroup,
  deleteGroup,
  addUserToGroup,
  removeUserFromGroup,
  type CreateGroupInput,
  type UpdateGroupInput,
  type GroupMemberRow,
} from '../api/groups'
import { fetchUsersForPicker } from '../api/userGroups'
import { logActivity } from '../api/activity'
import { supabase } from '../lib/supabase'
import type { Group } from '../types'

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function GroupsPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [membersId, setMembersId] = useState<string | null>(null)

  const { data: groups = [], isLoading } = useQuery({ queryKey: ['groups'], queryFn: fetchGroups })
  const { data: editGroup } = useQuery({
    queryKey: ['group', editId],
    queryFn: () => fetchGroup(editId!),
    enabled: !!editId,
  })
  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', membersId],
    queryFn: () => fetchGroupMembers(membersId!),
    enabled: !!membersId,
  })

  const createForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', description: '' } })
  const editForm = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: '', description: '' } })

  if (editGroup && editForm.getValues('name') !== editGroup.name) {
    editForm.reset({ name: editGroup.name, description: editGroup.description ?? '' })
  }

  const createMutation = useMutation({
    mutationFn: (input: CreateGroupInput) => createGroup(input),
    onSuccess: async (g) => {
      const { data: { user } } = await supabase.auth.getUser()
      await logActivity({ user_id: user?.id ?? null, action: 'create_group', entity_type: 'group', entity_id: g.id, payload: { name: g.name } })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setCreateOpen(false)
      createForm.reset()
      toast.success('Группа создана')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGroupInput }) => updateGroup(id, input),
    onSuccess: async (_, { id }) => {
      const { data: { user } } = await supabase.auth.getUser()
      await logActivity({ user_id: user?.id ?? null, action: 'update_group', entity_type: 'group', entity_id: id })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      setEditId(null)
      toast.success('Сохранено')
    },
    onError: (e: Error) => toast.error(e.message),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: async (_, id) => {
      const { data: { user } } = await supabase.auth.getUser()
      await logActivity({ user_id: user?.id ?? null, action: 'delete_group', entity_type: 'group', entity_id: id })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      toast.success('Группа удалена')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns = [
    { key: 'name', header: 'Название' },
    { key: 'description', header: 'Описание', render: (r: Group & { user_count?: number }) => r.description || '—' },
    { key: 'user_count', header: 'Участников', render: (r: Group & { user_count?: number }) => r.user_count ?? 0 },
    {
      key: 'actions',
      header: 'Действия',
      render: (r: Group & { user_count?: number }) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => setEditId(r.id)} className="text-primary-600 hover:underline">Изменить</button>
          <button type="button" onClick={() => setMembersId(r.id)} className="text-primary-600 hover:underline">Участники</button>
          <button
            type="button"
            onClick={() => window.confirm('Удалить группу?') && deleteMutation.mutate(r.id)}
            className="text-red-600 hover:underline"
          >
            Удалить
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Группы</h1>
          <p className="mt-1 text-slate-600">Группы пользователей и назначение участников</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white hover:bg-primary-800"
        >
          Создать группу
        </button>
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={groups}
          keyExtractor={(r) => r.id}
          isLoading={isLoading}
          emptyMessage="Нет групп"
        />
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Создать группу">
        <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Название</label>
            <input {...createForm.register('name')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            {createForm.formState.errors.name && <p className="mt-1 text-sm text-red-600">{createForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Описание</label>
            <textarea {...createForm.register('description')} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">Отмена</button>
            <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-primary-700 px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50">Создать</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editId} onClose={() => setEditId(null)} title="Редактировать группу">
        {editGroup && (
          <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate({ id: editId!, input: d }))} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Название</label>
              <input {...editForm.register('name')} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
              {editForm.formState.errors.name && <p className="mt-1 text-sm text-red-600">{editForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Описание</label>
              <textarea {...editForm.register('description')} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditId(null)} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">Отмена</button>
              <button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-primary-700 px-4 py-2 text-white hover:bg-primary-800 disabled:opacity-50">Сохранить</button>
            </div>
          </form>
        )}
      </Modal>

      {membersId && (
        <GroupMembersModal
          groupId={membersId}
          members={members}
          onClose={() => setMembersId(null)}
          onAdd={async (userId) => {
            await addUserToGroup(userId, membersId)
            queryClient.invalidateQueries({ queryKey: ['groupMembers', membersId] })
            queryClient.invalidateQueries({ queryKey: ['groups'] })
            toast.success('Пользователь добавлен')
          }}
          onRemove={async (userId) => {
            await removeUserFromGroup(userId, membersId)
            queryClient.invalidateQueries({ queryKey: ['groupMembers', membersId] })
            queryClient.invalidateQueries({ queryKey: ['groups'] })
            toast.success('Пользователь удалён из группы')
          }}
        />
      )}
    </div>
  )
}

function GroupMembersModal({
  members,
  onClose,
  onAdd,
  onRemove,
}: {
  groupId: string
  members: GroupMemberRow[]
  onClose: () => void
  onAdd: (userId: string) => Promise<void>
  onRemove: (userId: string) => Promise<void>
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { data: users = [] } = useQuery({
    queryKey: ['usersPicker', search],
    queryFn: () => fetchUsersForPicker(search),
  })
  const memberIds = members.map((m) => m.user_id)
  const available = users.filter((u) => !memberIds.includes(u.id))

  return (
    <Modal open onClose={onClose} title="Участники группы">
      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-sm text-slate-600">Участников: {members.length}</span>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="rounded-lg bg-primary-700 px-3 py-1.5 text-sm text-white hover:bg-primary-800"
          >
            Добавить
          </button>
        </div>
        <ul className="max-h-60 space-y-2 overflow-y-auto">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
              <span>{m.profiles?.email ?? m.user_id}</span>
              <button type="button" onClick={() => onRemove(m.user_id)} className="text-sm text-red-600 hover:underline">Удалить</button>
            </li>
          ))}
          {members.length === 0 && <li className="text-slate-500">Нет участников</li>}
        </ul>
        {pickerOpen && (
          <div className="rounded border border-slate-200 p-3">
            <input
              type="search"
              placeholder="Поиск пользователя..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {available.slice(0, 10).map((u) => (
                <li key={u.id} className="flex justify-between text-sm">
                  <span>{u.email}</span>
                  <button type="button" onClick={() => onAdd(u.id).then(() => setPickerOpen(false))} className="text-primary-600 hover:underline">Добавить</button>
                </li>
              ))}
              {available.length === 0 && search && <li className="text-slate-500">Не найдено</li>}
            </ul>
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-100">Закрыть</button>
        </div>
      </div>
    </Modal>
  )
}
