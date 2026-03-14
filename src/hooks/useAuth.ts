import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { User as AuthUser } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const isLoginPage = location.pathname === '/login'

  useEffect(() => {
    if (loading) return
    if (!user && !isLoginPage) {
      navigate('/login', { replace: true })
    } else if (user && isLoginPage) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, isLoginPage, navigate])

  return { user, loading }
}
