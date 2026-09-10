'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'
import { calcularEstado } from '@/lib/utils'
import type { Tarea, EstadoTarea } from '@/lib/types'
import { AlertTriangle, Clock, CheckCircle, Calendar, HelpCircle, TrendingUp } from 'lucide-react'

interface Stats {
  total: number
  vencida: number
  hacerAhora: number
  proxima: number
  programada: number
  requiereFecha: number
  finalizada: number
  avancePromedio: number
}

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: number; icon: React.ElementType; color: string; href?: string
}) {
  const content = (
    <div className={`bg-gray-900 border rounded-xl p-4 flex items-center gap-4 hover:bg-gray-800 transition-colors ${color}`}>
      <div className={`p-3 rounded-lg bg-gray-800`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  )
  if (href) return <Link href={href}>{content}</Link>
  return content
}

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [tareasCriticas, setTareasCriticas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) { router.push('/'); return }

      const { data: tareas } = await supabase
        .from('tareas_pap')
        .select('*')
        .neq('aplica', false)
        .order('id')

      if (!tareas) return

      const withEstado = tareas.map(t => ({ ...t, estado: calcularEstado(t) as EstadoTarea }))

      const s: Stats = {
        total: withEstado.length,
        vencida: withEstado.filter(t => t.estado === 'VENCIDA').length,
        hacerAhora: withEstado.filter(t => t.estado === 'HACER AHORA').length,
        proxima: withEstado.filter(t => t.estado === 'PRÓXIMA').length,
        programada: withEstado.filter(t => t.estado === 'PROGRAMADA').length,
        requiereFecha: withEstado.filter(t => t.estado === 'REQUIERE FECHA').length,
        finalizada: withEstado.filter(t => t.estado === 'FINALIZADA').length,
        avancePromedio: Math.round(
          withEstado.reduce((a, t) => a + (t.porcentaje_avance || 0), 0) / withEstado.length
        ),
      }
      setStats(s)

      // Tareas críticas: HACER AHORA + PRÓXIMAS
      const criticas = withEstado
        .filter(t => t.estado === 'HACER AHORA' || t.estado === 'PRÓXIMA')
        .sort((a, b) => (a.dias_restantes ?? 999) - (b.dias_restantes ?? 999))
        .slice(0, 6)
      setTareasCriticas(criticas)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-500 animate-pulse">Cargando PAP 2026...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Panel de Control</h1>
          <p className="text-gray-500 text-sm">PAP 2026 · {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <StatCard label="HACER AHORA" value={stats!.hacerAhora} icon={Clock}
            color="border-orange-800 text-orange-400" href="/hoy" />
          <StatCard label="VENCIDAS" value={stats!.vencida} icon={AlertTriangle}
            color="border-red-900 text-red-400" href="/agenda?estado=VENCIDA" />
          <StatCard label="PRÓXIMAS" value={stats!.proxima} icon={Calendar}
            color="border-yellow-800 text-yellow-400" href="/agenda?estado=PRÓXIMA" />
          <StatCard label="PROGRAMADAS" value={stats!.programada} icon={CheckCircle}
            color="border-green-900 text-green-400" href="/agenda?estado=PROGRAMADA" />
          <StatCard label="REQUIEREN FECHA" value={stats!.requiereFecha} icon={HelpCircle}
            color="border-gray-700 text-gray-400" href="/agenda?estado=REQUIERE+FECHA" />
          <StatCard label="FINALIZADAS" value={stats!.finalizada} icon={TrendingUp}
            color="border-blue-900 text-blue-400" href="/agenda?estado=FINALIZADA" />
        </div>

        {/* Barra de avance global */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400 uppercase tracking-wider">Avance Global</span>
            <span className="text-sm font-bold text-white">{stats!.avancePromedio}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill bg-yellow-500" style={{ width: `${stats!.avancePromedio}%` }} />
          </div>
          <p className="text-xs text-gray-600 mt-1">{stats!.total} tareas totales en el PAP 2026</p>
        </div>

        {/* Tareas críticas */}
        {tareasCriticas.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Requieren atención inmediata
            </h2>
            <div className="space-y-2">
              {tareasCriticas.map(t => (
                <Link key={t.id} href={`/tarea/${t.id}`}
                  className="block bg-gray-900 border border-gray-800 hover:border-yellow-600 rounded-lg p-3 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 mb-0.5">{t.direccion}</p>
                      <p className="text-sm text-white font-medium truncate">{t.tarea || t.actividad}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Término PAP: {t.termino_pap_texto}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        t.estado === 'HACER AHORA' ? 'bg-orange-800 text-orange-200' : 'bg-yellow-800 text-yellow-200'
                      }`}>
                        {t.dias_restantes != null ? `${t.dias_restantes}d` : '—'}
                      </span>
                    </div>
                  </div>
                  {t.porcentaje_avance > 0 && (
                    <div className="mt-2 progress-bar">
                      <div className="progress-bar-fill bg-blue-500" style={{ width: `${t.porcentaje_avance}%` }} />
                    </div>
                  )}
                </Link>
              ))}
            </div>
            <Link href="/hoy" className="block text-center text-yellow-500 text-sm mt-3 hover:text-yellow-400">
              Ver todas las tareas de hoy →
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
