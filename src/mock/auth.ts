import { TEST_LOGIN } from '../config/testCredentials'
import { getDb, updateDb } from './db'
import type { MockProfile } from './seed'

const SESSION_KEY = 'admin-panel-mock-session'
const AUTH_EVENT = 'admin-panel-auth-change'

export type MockAuthUser = {
  id: string
  email: string
  user_metadata?: { full_name?: string }
}

function toAuthUser(profile: Pick<MockProfile, 'id' | 'email' | 'full_name'>): MockAuthUser {
  return {
    id: profile.id,
    email: profile.email,
    user_metadata: { full_name: profile.full_name ?? undefined },
  }
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT))
}

function readSessionUser(): MockAuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as MockAuthUser
  } catch {
    return null
  }
}

export function getSession() {
  const user = readSessionUser()
  return { data: { session: user ? { user } : null }, error: null }
}

export function getUser() {
  const user = readSessionUser()
  return Promise.resolve({ data: { user }, error: null })
}

export function onAuthStateChange(callback: (event: string, session: { user: MockAuthUser } | null) => void) {
  const handler = () => {
    const user = readSessionUser()
    callback('SIGNED_IN', user ? { user } : null)
  }
  window.addEventListener(AUTH_EVENT, handler)
  window.addEventListener('storage', (e) => {
    if (e.key === SESSION_KEY) handler()
  })
  return { data: { subscription: { unsubscribe: () => window.removeEventListener(AUTH_EVENT, handler) } } }
}

export function signInWithPassword({ email, password }: { email: string; password: string }) {
  const db = getDb()
  const profile = db.profiles.find(
    (p) => p.email.toLowerCase() === email.toLowerCase() && p.password === password && p.status !== 'blocked'
  )
  if (!profile) {
    return Promise.resolve({
      data: { user: null, session: null },
      error: { message: 'Неверный email или пароль' },
    })
  }
  const user = toAuthUser(profile)
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  notifyAuthChange()
  return Promise.resolve({ data: { user, session: { user } }, error: null })
}

export function signUp({
  email,
  password,
  options,
}: {
  email: string
  password: string
  options?: { data?: { full_name?: string } }
}) {
  const db = getDb()
  if (db.profiles.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
    return Promise.resolve({
      data: { user: null },
      error: { message: 'Пользователь с таким email уже существует' },
    })
  }
  const id = crypto.randomUUID()
  const full_name = options?.data?.full_name ?? null
  const t = new Date().toISOString()
  const profile: MockProfile = {
    id,
    email,
    password,
    full_name,
    avatar_url: null,
    role_id: null,
    status: 'active',
    created_at: t,
    updated_at: t,
  }
  updateDb((db) => {
    db.profiles.push(profile)
  })
  const user = toAuthUser(profile)
  return Promise.resolve({ data: { user, identities: [{}] }, error: null })
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY)
  notifyAuthChange()
  return Promise.resolve({ error: null })
}

export function validateTestCredentials(email: string, password: string) {
  return email === TEST_LOGIN.email && password === TEST_LOGIN.password
}
