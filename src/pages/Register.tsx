import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { logActivity } from '../api/activity'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || undefined },
        },
      })
      if (error) {
        toast.error(error.message)
        return
      }
      if (data.user) {
        await logActivity({
          user_id: data.user.id,
          action: 'create_user',
          entity_type: 'user',
          entity_id: data.user.id,
          payload: { email, self_register: true },
        })
      }
      toast.success(
        'Регистрация успешна. Можете войти.' +
          (data.user?.identities?.length === 0 ? ' (Если включено подтверждение email — проверьте почту.)' : '')
      )
      navigate('/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-slate-500">Загрузка…</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-semibold text-slate-900">Регистрация</h1>
        <p className="mt-2 text-sm text-slate-500">Создайте аккаунт для доступа в админ-панель</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
              Имя
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Иван Иванов"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-slate-400">Минимум 6 символов</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-700 py-2.5 font-medium text-white hover:bg-primary-800 disabled:opacity-50"
          >
            {loading ? 'Регистрация…' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
