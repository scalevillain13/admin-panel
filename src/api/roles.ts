import { supabase } from '../lib/supabase'
import { isMockMode } from '../lib/mockMode'
import * as mock from '../mock/api'
import type { Role, Permission } from '../types'

export async function fetchRoles() {
  if (isMockMode) return mock.mockFetchRoles()
  const { data, error } = await supabase.from('roles').select('*').order('name')
  if (error) throw error
  return (data ?? []) as Role[]
}

export async function fetchRole(id: string) {
  if (isMockMode) return mock.mockFetchRole(id)
  const { data, error } = await supabase
    .from('roles')
    .select('*, role_permissions(permission_id, permissions(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchPermissions() {
  if (isMockMode) return mock.mockFetchPermissions()
  const { data, error } = await supabase.from('permissions').select('*').order('category').order('code')
  if (error) throw error
  return (data ?? []) as Permission[]
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  if (isMockMode) return mock.mockUpdateRolePermissions(roleId, permissionIds)
  await supabase.from('role_permissions').delete().eq('role_id', roleId)
  if (permissionIds.length) {
    const { error } = await supabase
      .from('role_permissions')
      .insert(permissionIds.map((permission_id) => ({ role_id: roleId, permission_id })))
    if (error) throw error
  }
}

export type CreateRoleInput = { name: string; description?: string }
export type UpdateRoleInput = { name?: string; description?: string }

export async function createRole(input: CreateRoleInput) {
  if (isMockMode) return mock.mockCreateRole(input)
  const { data, error } = await supabase.from('roles').insert(input).select().single()
  if (error) throw error
  return data as Role
}

export async function updateRole(id: string, input: UpdateRoleInput) {
  if (isMockMode) return mock.mockUpdateRole(id, input)
  const { error } = await supabase.from('roles').update(input).eq('id', id)
  if (error) throw error
  return fetchRole(id)
}

export async function deleteRole(id: string) {
  if (isMockMode) return mock.mockDeleteRole(id)
  const { error } = await supabase.from('roles').delete().eq('id', id)
  if (error) throw error
}
