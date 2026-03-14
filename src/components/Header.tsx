import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Header() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="lg:pl-0" />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          Выйти
        </button>
      </div>
    </header>
  )
}
