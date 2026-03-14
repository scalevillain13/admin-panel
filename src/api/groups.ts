import { supabase } from '../lib/supabase'
import type { Group } from '../types'

export async function fetchGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      user_groups(user_id)
    `)
    .order('name')
  if (error) throw error
  return (data ?? []).map((g: { id: string; name: string; description: string | null; created_at: string; user_groups: unknown[] }) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    created_at: g.created_at,
    user_count: g.user_groups?.length ?? 0,
  })) as (Group & { user_count: number })[]
}

export async function fetchGroup(id: string) {
  const { data, error } = await supabase.from('groups').select('*').eq('id', id).single()
  if (error) throw error
  return data as Group
}

export type GroupMemberRow = {
  user_id: string
  profiles: { id: string; email: string; full_name: string | null; status?: string } | null
}

export async function fetchGroupMembers(groupId: string): Promise<GroupMemberRow[]> {
  const { data, error } = await supabase
    .from('user_groups')
    .select('user_id, profiles(id, email, full_name, status)')
    .eq('group_id', groupId)
  if (error) throw error
  return (data ?? []) as unknown as GroupMemberRow[]
}

export type CreateGroupInput = { name: string; description?: string }
export type UpdateGroupInput = { name?: string; description?: string }

export async function createGroup(input: CreateGroupInput) {
  const { data, error } = await supabase.from('groups').insert(input).select().single()
  if (error) throw error
  return data as Group
}

export async function updateGroup(id: string, input: UpdateGroupInput) {
  const { error } = await supabase.from('groups').update(input).eq('id', id)
  if (error) throw error
  return fetchGroup(id)
}

export async function deleteGroup(id: string) {
  const { error } = await supabase.from('groups').delete().eq('id', id)
  if (error) throw error
}

export async function addUserToGroup(userId: string, groupId: string) {
  const { error } = await supabase.from('user_groups').insert({ user_id: userId, group_id: groupId })
  if (error) throw error
}

export async function removeUserFromGroup(userId: string, groupId: string) {
  const { error } = await supabase.from('user_groups').delete().eq('user_id', userId).eq('group_id', groupId)
  if (error) throw error
}
