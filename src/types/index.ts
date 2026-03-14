export type UserStatus = 'active' | 'blocked' | 'pending'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role_id: string | null
  status: UserStatus
  created_at: string
  updated_at: string
  role?: Role
  groups?: Group[]
}

export interface Role {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Permission {
  id: string
  code: string
  name: string
  category: string | null
  created_at: string
}

export interface RolePermission {
  role_id: string
  permission_id: string
  permission?: Permission
}

export interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  user_count?: number
}

export interface UserGroup {
  user_id: string
  group_id: string
  user?: User
  group?: Group
}

export type ActivityAction =
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'block_user'
  | 'create_group'
  | 'update_group'
  | 'delete_group'
  | 'assign_role'
  | 'assign_group'
  | 'remove_group'
  | 'login'
  | 'logout'

export type EntityType = 'user' | 'group' | 'role' | 'permission'

export interface ActivityLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  payload: Record<string, unknown> | null
  ip: string | null
  user_agent: string | null
  created_at: string
  user?: { id: string; email: string; full_name: string | null } | User
}
