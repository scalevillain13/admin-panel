import { supabase } from './supabase'
import { isMockMode } from './mockMode'
import * as mockAuth from '../mock/auth'
import type { AuthSession, AuthUser, SignUpResult } from '../types/auth'

export type { AuthUser, AuthSession, SignUpResult } from '../types/auth'

export async function getSession() {
  if (isMockMode) return mockAuth.getSession()
  const result = await supabase.auth.getSession()
  return {
    data: {
      session: result.data.session
        ? ({ user: result.data.session.user as AuthUser } satisfies AuthSession)
        : null,
    },
    error: result.error,
  }
}

export async function getUser() {
  if (isMockMode) return mockAuth.getUser()
  const result = await supabase.auth.getUser()
  return {
    data: { user: (result.data.user as AuthUser | null) ?? null },
    error: result.error,
  }
}

export function onAuthStateChange(
  callback: (event: string, session: AuthSession | null) => void
) {
  if (isMockMode) {
    return mockAuth.onAuthStateChange(callback)
  }
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(_event, session ? { user: session.user as AuthUser } : null)
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
  const result = await supabase.auth.signUp(params)
  return {
    data: {
      user: (result.data.user as AuthUser | null) ?? null,
      identities: result.data.user?.identities,
    } satisfies SignUpResult,
    error: result.error,
  }
}

export async function signOut() {
  if (isMockMode) return mockAuth.signOut()
  return supabase.auth.signOut()
}
