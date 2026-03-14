import { supabase } from '../lib/supabase'
import type { Role, Permission } from '../types'

export async function fetchRoles() {
  const { data, error } = await supabase.from('roles').select('*').order('name')
  if (error) throw error
  return (data ?? []) as Role[]
}

export async function fetchRole(id: string) {
  const { data, error } = await supabase
    .from('roles')
    .select('*, role_permissions(permission_id, permissions(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function fetchPermissions() {
  const { data, error } = await supabase.from('permissions').select('*').order('category').order('code')
  if (error) throw error
  return (data ?? []) as Permission[]
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
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
  const { data, error } = await supabase.from('roles').insert(input).select().single()
  if (error) throw error
  return data as Role
}

export async function updateRole(id: string, input: UpdateRoleInput) {
  const { error } = await supabase.from('roles').update(input).eq('id', id)
  if (error) throw error
  return fetchRole(id)
}

export async function deleteRole(id: string) {
  const { error } = await supabase.from('roles').delete().eq('id', id)
  if (error) throw error
}
