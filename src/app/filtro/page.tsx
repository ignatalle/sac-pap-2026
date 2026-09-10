'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'
import type { Tarea } from '@/lib/types'
import { CheckCircle, XCircle, Search } from 'lucide-react'

export default function FiltroTareas() {
  const router = useRouter()
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data: session } = await supabase.auth.getSession()
        if (!session.session) { router.push('/'); return }
        const { data, error } = await supabase
          .from('tareas_pap')
          .select('id, direccion, actividad, tarea, aplica')
          .order('id')
        if (error) console.error('Error:', error)
        if (data) setTareas(data as unknown as Tarea[])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  async function toggleAplica(id: number, valorActual: boolean) {
    setGuardando(id)
    const nuevoValor = !valorActual
    await supabase
      .from('tareas_pap')
      .update({ aplica: nuevoValor })
      .eq('id', id)
    setTareas(prev => prev.map(t => t.id === id ? { ...t, aplica: nuevoValor } : t))
    setGuardando(null)
  }

  async function marcarTodas(valor: boolean) {
    await supabase.from('tareas_pap').update({ aplica: valor }).neq('id', 0)
    setTareas(prev => prev.map(t => ({ ...t, aplica: valor })))
  }

  const filtradas = tareas.filter(t => {
    if (!busqueda.trim()) return true
    const b = busqueda.toLowerCase()
    return (
      t.tarea?.toLowerCase().includes(b) ||
      t.actividad?.toLowerCase().includes(b) ||
      t.direccion?.toLowerCase().includes(b)
    )
  })

  // Agrupar por dirección
  const grupos: Record<string, Tarea[]> = {}
  filtradas.forEach(t => {
    const dir = t.direccion || 'Sin dirección'
    if (!grupos[dir]) grupos[dir] = []
    grupos[dir].push(t)
  })

  const totalAplica = tareas.filter(t => t.aplica !== false).length
  const totalNoAplica = tareas.filter(t => t.aplica === false).length

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-500 animate-pulse">Cargando tareas...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-white">Filtro de tareas</h1>
          <p className="text-gray-500 text-sm">Seleccioná cuáles aplican a tu unidad</p>
        </div>

        {/* Stats y acciones rápidas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-4">
              <div>
                <p className="text-lg font-bold text-green-400">{totalAplica}</p>
                <p className="text-xs text-gray-500">Aplican</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-400">{totalNoAplica}</p>
                <p className="text-xs text-gray-500">No aplican</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-400">{tareas.length}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => marcarTodas(true)}
              className="flex-1 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-xs font-semibold text-green-200 transition-colors">
              ✓ Marcar todas
            </button>
            <button onClick={() => marcarTodas(false)}
              className="flex-1 py-2 bg-red-900 hover:bg-red-800 rounded-lg text-xs font-semibold text-red-200 transition-colors">
              ✗ Desmarcar todas
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar tarea..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
          />
        </div>

        {/* Lista agrupada */}
        <div className="space-y-4">
          {Object.entries(grupos).map(([dir, items]) => (
            <div key={dir}>
              <h2 className="text-xs font-semibold text-yellow-600 uppercase tracking-wider mb-2 px-1">
                {dir} ({items.filter(t => t.aplica !== false).length}/{items.length})
              </h2>
              <div className="space-y-1">
                {items.map(t => {
                  const aplica = t.aplica !== false
                  const cargando = guardando === t.id
                  return (
                    <button key={t.id}
                      onClick={() => toggleAplica(t.id, aplica)}
                      disabled={cargando}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left
                        ${aplica
                          ? 'bg-gray-900 border-gray-700 hover:border-green-700'
                          : 'bg-gray-950 border-gray-800 opacity-50 hover:opacity-70'
                        }`}>
                      <div className="shrink-0">
                        {cargando ? (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-500 border-t-yellow-500 animate-spin" />
                        ) : aplica ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <XCircle size={20} className="text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{t.tarea || t.actividad}</p>
                        <p className="text-xs text-gray-600 truncate">{t.actividad}</p>
                      </div>
                      <span className="text-xs text-gray-700 shrink-0">#{t.id}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
