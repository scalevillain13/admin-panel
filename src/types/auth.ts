export type AuthUser = {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

export type AuthSession = {
  user: AuthUser
}

export type SignUpResult = {
  user: AuthUser | null
  identities?: unknown[]
}
