import { supabase } from '../lib/supabase'
import type { User, UserStatus } from '../types'

export type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role_id: string | null
  status: UserStatus
  created_at: string
  updated_at: string
  roles?: { id: string; name: string; description: string | null } | null
}

function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    avatar_url: row.avatar_url,
    role_id: row.role_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    role: row.roles ? { id: row.roles.id, name: row.roles.name, description: row.roles.description, created_at: '' } : undefined,
  }
}

export async function fetchUsers(params?: { search?: string; role_id?: string; status?: string }) {
  let q = supabase
    .from('profiles')
    .select('*, roles(id, name, description)', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (params?.search) {
    q = q.or(`email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`)
  }
  if (params?.role_id) {
    q = q.eq('role_id', params.role_id)
  }
  if (params?.status) {
    q = q.eq('status', params.status)
  }

  const { data, error, count } = await q
  if (error) throw error
  return { data: (data ?? []).map((r: ProfileRow) => toUser(r)), count: count ?? 0 }
}

export async function fetchUser(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, roles(id, name, description)')
    .eq('id', id)
    .single()
  if (error) throw error
  return toUser(data as ProfileRow)
}

export type CreateUserInput = {
  email: string
  password: string
  full_name?: string
  role_id?: string
  status?: UserStatus
}

export async function createUser(input: CreateUserInput) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { full_name: input.full_name },
    },
  })
  if (authError) throw authError
  const id = authData.user?.id
  if (!id) throw new Error('User not created')

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role_id: input.role_id ?? null,
      status: input.status ?? 'active',
      full_name: input.full_name ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (profileError) throw profileError

  return fetchUser(id)
}

export type UpdateUserInput = {
  full_name?: string
  role_id?: string | null
  status?: UserStatus
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const { error } = await supabase
    .from('profiles')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
  return fetchUser(id)
}

export async function blockUser(id: string) {
  return updateUser(id, { status: 'blocked' })
}
