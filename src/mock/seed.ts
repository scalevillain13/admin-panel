import type { ActivityLog, Group, Permission, Role, User, UserStatus } from '../types'
import { TEST_LOGIN } from '../config/testCredentials'

export type MockProfile = User & { password: string }

export type MockDb = {
  profiles: MockProfile[]
  roles: Role[]
  permissions: Permission[]
  rolePermissions: { role_id: string; permission_id: string }[]
  groups: Group[]
  userGroups: { user_id: string; group_id: string }[]
  activityLogs: ActivityLog[]
}

const now = () => new Date().toISOString()

const ROLES: Role[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Admin', description: 'Полный доступ', created_at: now() },
  { id: 'a0000000-0000-0000-0000-000000000002', name: 'Operator', description: 'Управление пользователями и группами', created_at: now() },
  { id: 'a0000000-0000-0000-0000-000000000003', name: 'Viewer', description: 'Только просмотр', created_at: now() },
]

const PERMISSIONS: Permission[] = [
  { id: 'b0000000-0000-0000-0000-000000000001', code: 'users.view', name: 'Просмотр пользователей', category: 'users', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000002', code: 'users.create', name: 'Создание пользователей', category: 'users', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000003', code: 'users.update', name: 'Редактирование пользователей', category: 'users', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000004', code: 'users.delete', name: 'Удаление/блокировка пользователей', category: 'users', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000005', code: 'groups.view', name: 'Просмотр групп', category: 'groups', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000006', code: 'groups.create', name: 'Создание групп', category: 'groups', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000007', code: 'groups.update', name: 'Редактирование групп', category: 'groups', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000008', code: 'groups.delete', name: 'Удаление групп', category: 'groups', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000009', code: 'roles.view', name: 'Просмотр ролей', category: 'roles', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000010', code: 'roles.manage', name: 'Управление ролями и правами', category: 'roles', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000011', code: 'permissions.view', name: 'Просмотр прав', category: 'permissions', created_at: now() },
  { id: 'b0000000-0000-0000-0000-000000000012', code: 'activity.view', name: 'Просмотр лога активности', category: 'activity', created_at: now() },
]

function profile(
  id: string,
  email: string,
  password: string,
  full_name: string,
  role_id: string,
  status: UserStatus = 'active'
): MockProfile {
  const t = now()
  return {
    id,
    email,
    password,
    full_name,
    avatar_url: null,
    role_id,
    status,
    created_at: t,
    updated_at: t,
  }
}

export function createSeedDb(): MockDb {
  const adminId = 'c0000000-0000-0000-0000-000000000001'
  const profiles: MockProfile[] = [
    profile(adminId, TEST_LOGIN.email, TEST_LOGIN.password, TEST_LOGIN.label, ROLES[0].id),
    profile('c0000000-0000-0000-0000-000000000002', 'operator@test.com', 'operator123', 'Оператор', ROLES[1].id),
    profile('c0000000-0000-0000-0000-000000000003', 'viewer@test.com', 'viewer123', 'Наблюдатель', ROLES[2].id),
  ]

  const groups: Group[] = [
    { id: 'd0000000-0000-0000-0000-000000000001', name: 'Поддержка', description: 'Служба поддержки', created_at: now() },
    { id: 'd0000000-0000-0000-0000-000000000002', name: 'Продажи', description: 'Отдел продаж', created_at: now() },
  ]

  const activityLogs: ActivityLog[] = [
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      user_id: adminId,
      action: 'login',
      entity_type: 'user',
      entity_id: adminId,
      payload: null,
      ip: null,
      user_agent: null,
      created_at: now(),
      user: { id: adminId, email: TEST_LOGIN.email, full_name: TEST_LOGIN.label },
    },
  ]

  return {
    profiles,
    roles: ROLES,
    permissions: PERMISSIONS,
    rolePermissions: PERMISSIONS.map((p) => ({
      role_id: ROLES[0].id,
      permission_id: p.id,
    })),
    groups,
    userGroups: [
      { user_id: adminId, group_id: groups[0].id },
      { user_id: profiles[1].id, group_id: groups[1].id },
    ],
    activityLogs,
  }
}
