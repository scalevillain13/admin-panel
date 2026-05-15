import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { isMockMode } from './mockMode'
import * as mockAuth from '../mock/auth'

export type AuthUser = Pick<SupabaseUser, 'id' | 'email' | 'user_metadata'>

type AuthError = { message: string }

export async function getSession() {
  if (isMockMode) return mockAuth.getSession()
  return supabase.auth.getSession()
}

export async function getUser() {
  if (isMockMode) return mockAuth.getUser()
  return supabase.auth.getUser()
}

export function onAuthStateChange(
  callback: (event: string, session: { user: AuthUser } | null) => void
) {
  if (isMockMode) {
    return mockAuth.onAuthStateChange(callback)
  }
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(_event, session as { user: AuthUser } | null)
  })
}

export async function signInWithPassword(credentials: { email: string; password: string }) {
  if (isMockMode) return mockAuth.signInWithPassword(credentials)
  return supabase.auth.signInWithPassword(credentials)
}

export async function signUp(params: {
  email: string
  password: string
  options?: { data?: { full_name?: string } }
}) {
  if (isMockMode) return mockAuth.signUp(params)
  return supabase.auth.signUp(params)
}

export async function signOut() {
  if (isMockMode) return mockAuth.signOut()
  return supabase.auth.signOut()
}
