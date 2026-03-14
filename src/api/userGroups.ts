import { supabase } from '../lib/supabase'
import type { User } from '../types'

export async function fetchUserGroups(userId: string) {
  const { data, error } = await supabase
    .from('user_groups')
    .select('group_id, groups(id, name, description)')
    .eq('user_id', userId)
  if (error) throw error
  const rows = (data ?? []) as unknown as { group_id: string; groups: { id: string; name: string; description: string | null } | null }[]
  return rows.map((r) => ({
    id: r.groups!.id,
    name: r.groups!.name,
    description: r.groups!.description,
  }))
}

export async function setUserGroups(userId: string, groupIds: string[]) {
  await supabase.from('user_groups').delete().eq('user_id', userId)
  if (groupIds.length) {
    const { error } = await supabase
      .from('user_groups')
      .insert(groupIds.map((group_id) => ({ user_id: userId, group_id })))
    if (error) throw error
  }
}

export async function fetchUsersForPicker(search?: string): Promise<Pick<User, 'id' | 'email' | 'full_name'>[]> {
  let q = supabase.from('profiles').select('id, email, full_name').eq('status', 'active').order('email')
  if (search) {
    q = q.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
  }
  const { data, error } = await q.limit(50)
  if (error) throw error
  return (data ?? []) as Pick<User, 'id' | 'email' | 'full_name'>[]
}
