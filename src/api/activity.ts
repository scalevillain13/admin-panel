import { supabase } from '../lib/supabase'
import type { ActivityLog } from '../types'

export type ActivityFilters = {
  user_id?: string
  action?: string
  entity_type?: string
  from?: string
  to?: string
}

export async function fetchActivityLogs(params?: { page?: number; pageSize?: number } & ActivityFilters) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let q = supabase
    .from('activity_logs')
    .select('*, profiles(id, email, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params?.user_id) q = q.eq('user_id', params.user_id)
  if (params?.action) q = q.eq('action', params.action)
  if (params?.entity_type) q = q.eq('entity_type', params.entity_type)
  if (params?.from) q = q.gte('created_at', params.from)
  if (params?.to) q = q.lte('created_at', params.to)

  const { data, error, count } = await q
  if (error) throw error
  const list = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    user: r.profiles,
  })) as ActivityLog[]
  return { data: list, count: count ?? 0 }
}

export async function logActivity(entry: {
  user_id?: string | null
  action: string
  entity_type?: string | null
  entity_id?: string | null
  payload?: Record<string, unknown> | null
  ip?: string | null
  user_agent?: string | null
}) {
  const { error } = await supabase.from('activity_logs').insert(entry)
  if (error) throw error
}
