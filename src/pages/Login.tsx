import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { signInWithPassword } from '../lib/auth'
import { isMockMode } from '../lib/mockMode'
import { logActivity } from '../api/activity'
import { SHOW_TEST_LOGIN_HINT, TEST_LOGIN } from '../config/testCredentials'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState(SHOW_TEST_LOGIN_HINT ? TEST_LOGIN.email : '')
  const [password, setPassword] = useState(SHOW_TEST_LOGIN_HINT ? TEST_LOGIN.password : '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await signInWithPassword({ email, password })
      if (error) {
        toast.error(error.message)
        return
      }
      await logActivity({
        user_id: data.user?.id ?? null,
        action: 'login',
        entity_type: 'user',
        entity_id: data.user?.id ?? null,
      })
      toast.success('Вход выполнен')
      navigate('/dashboard', { replace: true })
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
        <h1 className="text-xl font-semibold text-slate-900">Вход в админ-панель</h1>
        <p className="mt-2 text-sm text-slate-500">Введите email и пароль</p>
        {SHOW_TEST_LOGIN_HINT && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
            <p className="font-medium">Тестовые данные для входа</p>
            <p className="mt-1 text-amber-900/90">
              Email: <span className="font-mono">{TEST_LOGIN.email}</span>
              <br />
              Пароль: <span className="font-mono">{TEST_LOGIN.password}</span>
            </p>
            {isMockMode && (
              <p className="mt-2 text-xs text-amber-800/80">
                Демо-режим: данные хранятся локально в браузере, Supabase не нужен.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setEmail(TEST_LOGIN.email)
                setPassword(TEST_LOGIN.password)
              }}
              className="mt-2 text-xs font-medium text-amber-900 underline hover:no-underline"
            >
              Заполнить поля
            </button>
          </div>
        )}
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
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary-700 py-2.5 font-medium text-white hover:bg-primary-800 disabled:opacity-50"
          >
            {loading ? 'Вход…' : 'Войти'}
          </button>
          <Link
            to="/register"
            className="mt-3 flex w-full justify-center rounded-lg border border-primary-600 py-2.5 font-medium text-primary-700 hover:bg-primary-50"
          >
            Зарегистрироваться
          </Link>
        </form>
      </div>
    </div>
  )
}
