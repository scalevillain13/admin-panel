import { isMockMode } from '../lib/mockMode'

/** Тестовый аккаунт для локального демо-режима (без Supabase) */
export const TEST_LOGIN = {
  email: import.meta.env.VITE_TEST_EMAIL ?? 'admin@test.com',
  password: import.meta.env.VITE_TEST_PASSWORD ?? 'admin123',
  label: 'Тестовый админ',
} as const

export const SHOW_TEST_LOGIN_HINT =
  isMockMode || import.meta.env.DEV || import.meta.env.VITE_SHOW_TEST_LOGIN === 'true'
