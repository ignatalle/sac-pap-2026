'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, CalendarDays, List, Settings, LogOut, AlertCircle, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const links = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/hoy', label: 'Hoy', icon: AlertCircle },
  { href: '/agenda', label: 'Agenda', icon: List },
  { href: '/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/filtro', label: 'Filtro', icon: Filter },
  { href: '/config', label: 'Config', icon: Settings },
]

export default function NavBar() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      {/* Top bar desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-yellow-600 flex items-center justify-center font-bold text-sm">EA</div>
          <span className="font-semibold text-yellow-400 tracking-wider text-sm">SAC-PAP 2026</span>
        </div>
        <nav className="flex gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors
                ${pathname.startsWith(href)
                  ? 'bg-yellow-600 text-gray-900 font-semibold'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-sm transition-colors">
          <LogOut size={16} /> Salir
        </button>
      </header>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="flex justify-around py-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors
                ${pathname.startsWith(href) ? 'text-yellow-400' : 'text-gray-500'}`}>
              <Icon size={20} />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
