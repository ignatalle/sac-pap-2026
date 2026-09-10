'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import EstadoBadge from '@/components/EstadoBadge'
import { supabase } from '@/lib/supabase'
import { calcularEstado } from '@/lib/utils'
import type { Tarea, EstadoTarea } from '@/lib/types'
import { Search, ChevronRight } from 'lucide-react'

const ESTADOS: EstadoTarea[] = ['HACER AHORA', 'VENCIDA', 'PRÓXIMA', 'PROGRAMADA', 'REQUIERE FECHA', 'FINALIZADA']

function AgendaContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [todas, setTodas] = useState<Tarea[]>([])
  const [filtradas, setFiltradas] = useState<Tarea[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<string>(params.get('estado') || '')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) { router.push('/'); return }
      const { data } = await supabase.from('tareas_pap').select('*').order('id')
      if (!data) return
      const con = data.map(t => ({ ...t, estado: calcularEstado(t) as EstadoTarea }))
      setTodas(con)
      setFiltradas(con)
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    let r = todas
    if (estadoFiltro) r = r.filter(t => t.estado === estadoFiltro)
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase()
      r = r.filter(t =>
        t.tarea.toLowerCase().includes(b) ||
        t.actividad.toLowerCase().includes(b) ||
        t.direccion.toLowerCase().includes(b) ||
        t.observaciones.toLowerCase().includes(b)
      )
    }
    setFiltradas(r)
  }, [busqueda, estadoFiltro, todas])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500 animate-pulse">
      Cargando agenda...
    </div>
  )

  return (
    <>
      {/* Filtros */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar tarea, actividad, departamento..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setEstadoFiltro('')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
              ${estadoFiltro === '' ? 'bg-yellow-600 text-gray-900' : 'bg-gray-800 text-gray-400'}`}>
            Todos ({todas.length})
          </button>
          {ESTADOS.map(e => {
            const count = todas.filter(t => t.estado === e).length
            return (
              <button key={e}
                onClick={() => setEstadoFiltro(e === estadoFiltro ? '' : e)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                  ${estadoFiltro === e ? 'bg-yellow-600 text-gray-900' : 'bg-gray-800 text-gray-400'}`}>
                {e} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filtradas.length === 0 && (
          <div className="text-center py-10 text-gray-600">Sin resultados</div>
        )}
        {filtradas.map(t => (
          <Link key={t.id} href={`/tarea/${t.id}`}
            className="block bg-gray-900 border border-gray-800 hover:border-yellow-600 rounded-lg px-4 py-3 transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <EstadoBadge estado={t.estado} />
                  <span className="text-xs text-gray-600">#{t.id}</span>
                </div>
                <p className="text-xs text-yellow-600/80 mb-0.5">{t.direccion}</p>
                <p className="text-sm text-white truncate">{t.tarea || t.actividad}</p>
                <p className="text-xs text-gray-600 mt-0.5">PAP: {t.termino_pap_texto || 'Sin fecha'}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {t.porcentaje_avance > 0 && (
                  <span className="text-xs text-blue-400">{t.porcentaje_avance}%</span>
                )}
                <ChevronRight size={16} className="text-gray-600" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}

export default function Agenda() {
  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-white">Agenda Anual</h1>
          <p className="text-gray-500 text-sm">PAP 2026 — 264 tareas</p>
        </div>
        <Suspense fallback={<div className="text-gray-500">Cargando...</div>}>
          <AgendaContent />
        </Suspense>
      </main>
    </div>
  )
}
