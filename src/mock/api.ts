import type { ActivityLog, Group, Role, User, UserStatus } from '../types'
import { getDb, updateDb } from './db'
import type { MockProfile } from './seed'

const now = () => new Date().toISOString()

function stripPassword(p: MockProfile): User {
  const { password: _, ...rest } = p
  const db = getDb()
  const roleRow = p.role_id ? db.roles.find((r) => r.id === p.role_id) : undefined
  return {
    ...rest,
    role: roleRow ? { ...roleRow } : undefined,
  }
}

function nextId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

// ——— Users ———

export function mockFetchUsers(params?: { search?: string; role_id?: string; status?: string }) {
  const db = getDb()
  let list = db.profiles.map(stripPassword)
  if (params?.search) {
    const s = params.search.toLowerCase()
    list = list.filter(
      (u) => u.email.toLowerCase().includes(s) || (u.full_name?.toLowerCase().includes(s) ?? false)
    )
  }
  if (params?.role_id) list = list.filter((u) => u.role_id === params.role_id)
  if (params?.status) list = list.filter((u) => u.status === params.status)
  list.sort((a, b) => b.created_at.localeCompare(a.created_at))
  return Promise.resolve({ data: list, count: list.length })
}

export function mockFetchUser(id: string) {
  const p = getDb().profiles.find((x) => x.id === id)
  if (!p) return Promise.reject(new Error('Пользователь не найден'))
  return Promise.resolve(stripPassword(p))
}

export function mockCreateUser(input: {
  email: string
  password: string
  full_name?: string
  role_id?: string
  status?: UserStatus
}) {
  const db = getDb()
  if (db.profiles.some((p) => p.email.toLowerCase() === input.email.toLowerCase())) {
    return Promise.reject(new Error('Пользователь с таким email уже существует'))
  }
  const t = now()
  const profile: MockProfile = {
    id: crypto.randomUUID(),
    email: input.email,
    password: input.password,
    full_name: input.full_name ?? null,
    avatar_url: null,
    role_id: input.role_id ?? null,
    status: input.status ?? 'active',
    created_at: t,
    updated_at: t,
  }
  updateDb((db) => {
    db.profiles.push(profile)
  })
  return mockFetchUser(profile.id)
}

export function mockUpdateUser(
  id: string,
  input: { full_name?: string; role_id?: string | null; status?: UserStatus }
) {
  updateDb((db) => {
    const p = db.profiles.find((x) => x.id === id)
    if (!p) throw new Error('Пользователь не найден')
    Object.assign(p, input, { updated_at: now() })
  })
  return mockFetchUser(id)
}

export function mockBlockUser(id: string) {
  return mockUpdateUser(id, { status: 'blocked' })
}

// ——— Groups ———

export function mockFetchGroups() {
  const db = getDb()
  const groups = db.groups.map((g) => ({
    ...g,
    user_count: db.userGroups.filter((ug) => ug.group_id === g.id).length,
  }))
  return Promise.resolve(groups)
}

export function mockFetchGroup(id: string) {
  const g = getDb().groups.find((x) => x.id === id)
  if (!g) return Promise.reject(new Error('Группа не найдена'))
  return Promise.resolve(g)
}

export function mockFetchGroupMembers(groupId: string) {
  const db = getDb()
  return Promise.resolve(
    db.userGroups
      .filter((ug) => ug.group_id === groupId)
      .map((ug) => {
        const p = db.profiles.find((x) => x.id === ug.user_id)
        return {
          user_id: ug.user_id,
          profiles: p
            ? { id: p.id, email: p.email, full_name: p.full_name, status: p.status }
            : null,
        }
      })
  )
}

export function mockCreateGroup(input: { name: string; description?: string }) {
  const group: Group = {
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description ?? null,
    created_at: now(),
  }
  updateDb((db) => {
    db.groups.push(group)
  })
  return Promise.resolve(group)
}

export function mockUpdateGroup(id: string, input: { name?: string; description?: string }) {
  updateDb((db) => {
    const g = db.groups.find((x) => x.id === id)
    if (!g) throw new Error('Группа не найдена')
    Object.assign(g, input)
  })
  return mockFetchGroup(id)
}

export function mockDeleteGroup(id: string) {
  updateDb((db) => {
    db.groups = db.groups.filter((g) => g.id !== id)
    db.userGroups = db.userGroups.filter((ug) => ug.group_id !== id)
  })
  return Promise.resolve()
}

export function mockAddUserToGroup(userId: string, groupId: string) {
  updateDb((db) => {
    if (!db.userGroups.some((ug) => ug.user_id === userId && ug.group_id === groupId)) {
      db.userGroups.push({ user_id: userId, group_id: groupId })
    }
  })
  return Promise.resolve()
}

export function mockRemoveUserFromGroup(userId: string, groupId: string) {
  updateDb((db) => {
    db.userGroups = db.userGroups.filter((ug) => !(ug.user_id === userId && ug.group_id === groupId))
  })
  return Promise.resolve()
}

// ——— Roles ———

export function mockFetchRoles() {
  return Promise.resolve([...getDb().roles].sort((a, b) => a.name.localeCompare(b.name)))
}

export function mockFetchRole(id: string) {
  const db = getDb()
  const role = db.roles.find((r) => r.id === id)
  if (!role) return Promise.reject(new Error('Роль не найдена'))
  const role_permissions = db.rolePermissions
    .filter((rp) => rp.role_id === id)
    .map((rp) => {
      const permission = db.permissions.find((p) => p.id === rp.permission_id)
      return { permission_id: rp.permission_id, permissions: permission }
    })
  return Promise.resolve({ ...role, role_permissions })
}

export function mockFetchPermissions() {
  const db = getDb()
  return Promise.resolve(
    [...db.permissions].sort((a, b) => {
      const c = (a.category ?? '').localeCompare(b.category ?? '')
      return c !== 0 ? c : a.code.localeCompare(b.code)
    })
  )
}

export function mockUpdateRolePermissions(roleId: string, permissionIds: string[]) {
  updateDb((db) => {
    db.rolePermissions = db.rolePermissions.filter((rp) => rp.role_id !== roleId)
    for (const permission_id of permissionIds) {
      db.rolePermissions.push({ role_id: roleId, permission_id })
    }
  })
  return Promise.resolve()
}

export function mockCreateRole(input: { name: string; description?: string }) {
  const role: Role = {
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description ?? null,
    created_at: now(),
  }
  updateDb((db) => {
    db.roles.push(role)
  })
  return Promise.resolve(role)
}

export function mockUpdateRole(id: string, input: { name?: string; description?: string }) {
  updateDb((db) => {
    const r = db.roles.find((x) => x.id === id)
    if (!r) throw new Error('Роль не найдена')
    Object.assign(r, input)
  })
  return mockFetchRole(id)
}

export function mockDeleteRole(id: string) {
  updateDb((db) => {
    db.roles = db.roles.filter((r) => r.id !== id)
    db.rolePermissions = db.rolePermissions.filter((rp) => rp.role_id !== id)
    db.profiles.forEach((p) => {
      if (p.role_id === id) p.role_id = null
    })
  })
  return Promise.resolve()
}

// ——— User groups ———

export function mockFetchUserGroups(userId: string) {
  const db = getDb()
  return Promise.resolve(
    db.userGroups
      .filter((ug) => ug.user_id === userId)
      .map((ug) => db.groups.find((g) => g.id === ug.group_id))
      .filter(Boolean)
      .map((g) => ({ id: g!.id, name: g!.name, description: g!.description }))
  )
}

export function mockSetUserGroups(userId: string, groupIds: string[]) {
  updateDb((db) => {
    db.userGroups = db.userGroups.filter((ug) => ug.user_id !== userId)
    for (const group_id of groupIds) {
      db.userGroups.push({ user_id: userId, group_id })
    }
  })
  return Promise.resolve()
}

export function mockFetchUsersForPicker(search?: string) {
  let list = getDb().profiles.filter((p) => p.status === 'active')
  if (search) {
    const s = search.toLowerCase()
    list = list.filter(
      (p) => p.email.toLowerCase().includes(s) || (p.full_name?.toLowerCase().includes(s) ?? false)
    )
  }
  return Promise.resolve(
    list
      .slice(0, 50)
      .map((p) => ({ id: p.id, email: p.email, full_name: p.full_name }))
      .sort((a, b) => a.email.localeCompare(b.email))
  )
}

// ——— Activity ———

export function mockFetchActivityLogs(params?: {
  page?: number
  pageSize?: number
  user_id?: string
  action?: string
  entity_type?: string
  from?: string
  to?: string
}) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const db = getDb()
  let list = [...db.activityLogs]
  if (params?.user_id) list = list.filter((l) => l.user_id === params.user_id)
  if (params?.action) list = list.filter((l) => l.action === params.action)
  if (params?.entity_type) list = list.filter((l) => l.entity_type === params.entity_type)
  if (params?.from) list = list.filter((l) => l.created_at >= params.from!)
  if (params?.to) list = list.filter((l) => l.created_at <= params.to!)
  list.sort((a, b) => b.created_at.localeCompare(a.created_at))
  const count = list.length
  const from = (page - 1) * pageSize
  const data = list.slice(from, from + pageSize).map((r) => {
    const profile = r.user_id ? db.profiles.find((p) => p.id === r.user_id) : undefined
    return {
      ...r,
      user: profile
        ? { id: profile.id, email: profile.email, full_name: profile.full_name }
        : r.user,
    }
  }) as ActivityLog[]
  return Promise.resolve({ data, count })
}

export function mockLogActivity(entry: {
  user_id?: string | null
  action: string
  entity_type?: string | null
  entity_id?: string | null
  payload?: Record<string, unknown> | null
  ip?: string | null
  user_agent?: string | null
}) {
  const db = getDb()
  const profile = entry.user_id ? db.profiles.find((p) => p.id === entry.user_id) : undefined
  const log: ActivityLog = {
    id: nextId('log'),
    user_id: entry.user_id ?? null,
    action: entry.action,
    entity_type: entry.entity_type ?? null,
    entity_id: entry.entity_id ?? null,
    payload: entry.payload ?? null,
    ip: entry.ip ?? null,
    user_agent: entry.user_agent ?? null,
    created_at: now(),
    user: profile
      ? { id: profile.id, email: profile.email, full_name: profile.full_name }
      : undefined,
  }
  updateDb((db) => {
    db.activityLogs.unshift(log)
  })
  return Promise.resolve()
}
