const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

const hasSupabaseConfig =
  Boolean(url) &&
  Boolean(key) &&
  !url.includes('your-project') &&
  key !== 'your-anon-key'

/** Локальный режим без Supabase: по умолчанию, если ключи не заданы, или VITE_USE_MOCK=true */
export const isMockMode =
  import.meta.env.VITE_USE_MOCK === 'true' ||
  (import.meta.env.VITE_USE_MOCK !== 'false' && !hasSupabaseConfig)
