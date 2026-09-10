'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import EstadoBadge from '@/components/EstadoBadge'
import { supabase } from '@/lib/supabase'
import { calcularEstado, formatFecha } from '@/lib/utils'
import type { Tarea, EstadoTarea } from '@/lib/types'

export default function ControlHoy() {
  const router = useRouter()
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) { router.push('/'); return }

      const { data } = await supabase.from('tareas_pap').select('*').neq('aplica', false).order('id')
      if (!data) return

      const criticas = data
        .map(t => ({ ...t, estado: calcularEstado(t) as EstadoTarea }))
        .filter(t => t.estado === 'HACER AHORA' || t.estado === 'PRÓXIMA' || t.estado === 'VENCIDA')
        .sort((a, b) => {
          const order = { 'VENCIDA': 0, 'HACER AHORA': 1, 'PRÓXIMA': 2 }
          return (order[a.estado as keyof typeof order] ?? 9) - (order[b.estado as keyof typeof order] ?? 9)
        })

      setTareas(criticas)
      setLoading(false)
    }
    load()
  }, [router])

  async function actualizarAvance(id: number, pct: number) {
    await supabase.from('tareas_pap').update({ porcentaje_avance: pct }).eq('id', id)
    setTareas(prev => prev.map(t => t.id === id ? { ...t, porcentaje_avance: pct } : t))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-500 animate-pulse">Calculando tareas de hoy...</div>
    </div>
  )

  const vencidas = tareas.filter(t => t.estado === 'VENCIDA')
  const hacerAhora = tareas.filter(t => t.estado === 'HACER AHORA')
  const proximas = tareas.filter(t => t.estado === 'PRÓXIMA')

  function Grupo({ titulo, items, color }: { titulo: string; items: Tarea[]; color: string }) {
    if (items.length === 0) return null
    return (
      <div className="mb-6">
        <h2 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${color}`}>{titulo} ({items.length})</h2>
        <div className="space-y-3">
          {items.map(t => (
            <Link key={t.id} href={`/tarea/${t.id}`}
              className="block bg-gray-900 border border-gray-800 hover:border-yellow-600 rounded-xl p-4 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <EstadoBadge estado={t.estado} />
                {t.dias_restantes != null && (
                  <span className="text-xs text-gray-500">
                    {t.dias_restantes >= 0 ? `${t.dias_restantes} días` : `${Math.abs(t.dias_restantes)}d vencida`}
                  </span>
                )}
              </div>
              <p className="text-xs text-yellow-600 mb-1 font-medium">{t.direccion}</p>
              <p className="text-sm text-white font-semibold mb-1">{t.tarea || t.actividad}</p>
              {t.observaciones && (
                <p className="text-xs text-gray-500 line-clamp-2">{t.observaciones}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-gray-600">PAP: {t.termino_pap_texto || '—'}</span>
                <span className="text-xs text-gray-600">Límite: {formatFecha(t.fecha_limite_efectiva)}</span>
              </div>

              {/* Barra de avance rápido */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Avance</span>
                  <span className="text-xs text-gray-400">{t.porcentaje_avance}%</span>
                </div>
                <div className="flex gap-1">
                  {[0, 25, 50, 75, 100].map(pct => (
                    <button key={pct} onClick={e => { e.preventDefault(); actualizarAvance(t.id, pct) }}
                      className={`flex-1 py-1 rounded text-xs font-medium transition-colors
                        ${t.porcentaje_avance >= pct && pct > 0
                          ? 'bg-blue-700 text-blue-100'
                          : pct === 0 && t.porcentaje_avance === 0
                            ? 'bg-gray-700 text-gray-300'
                            : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Control de Hoy</h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {' · '}{tareas.length} tareas requieren atención
          </p>
        </div>

        {tareas.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold">Sin tareas urgentes hoy</p>
            <p className="text-sm mt-1">Todo está bajo control</p>
          </div>
        )}

        <Grupo titulo="🔴 Vencidas — Intervención inmediata" items={vencidas} color="text-red-400" />
        <Grupo titulo="🟠 Hacer Ahora" items={hacerAhora} color="text-orange-400" />
        <Grupo titulo="🟡 Próximas — Empezar a preparar" items={proximas} color="text-yellow-400" />
      </main>
    </div>
  )
}
