'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'
import { calcularEstado, estadoConfig } from '@/lib/utils'
import type { Tarea, EstadoTarea } from '@/lib/types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Calendario() {
  const router = useRouter()
  const [tareas, setTareas] = useState<Tarea[]>([])
  const [mesActual, setMesActual] = useState(new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) { router.push('/'); return }
      const { data } = await supabase
        .from('tareas_pap')
        .select('*')
        .not('fecha_limite_efectiva', 'is', null)
        .order('fecha_limite_efectiva')
      if (!data) return
      setTareas(data.map(t => ({ ...t, estado: calcularEstado(t) as EstadoTarea })))
      setLoading(false)
    }
    load()
  }, [router])

  const diasDelMes = eachDayOfInterval({
    start: startOfMonth(mesActual),
    end: endOfMonth(mesActual),
  })

  // Primer día de la semana (0=Dom, ajustar para Lun)
  const primerDia = startOfMonth(mesActual).getDay()
  const offset = primerDia === 0 ? 6 : primerDia - 1

  function tareasDelDia(dia: Date) {
    return tareas.filter(t => t.fecha_limite_efectiva && isSameDay(parseISO(t.fecha_limite_efectiva), dia))
  }

  function tareasSeleccionadas() {
    if (!diaSeleccionado) return []
    return tareasDelDia(diaSeleccionado)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-500 animate-pulse">Cargando calendario...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">

        {/* Header mes */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-white capitalize">
            {format(mesActual, 'MMMM yyyy', { locale: es })}
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setMesActual(subMonths(mesActual, 1))}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setMesActual(new Date())}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-semibold transition-colors">
              Hoy
            </button>
            <button onClick={() => setMesActual(addMonths(mesActual, 1))}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Días de semana */}
        <div className="grid grid-cols-7 mb-1">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center text-xs text-gray-600 font-semibold py-1">{d}</div>
          ))}
        </div>

        {/* Grilla del mes */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {/* Offset inicial */}
          {Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {diasDelMes.map(dia => {
            const tDia = tareasDelDia(dia)
            const esHoy = isToday(dia)
            const esSeleccionado = diaSeleccionado && isSameDay(dia, diaSeleccionado)

            // Color del punto según estado más urgente
            const estadoMasUrgente = tDia.find(t => t.estado === 'VENCIDA')?.estado
              || tDia.find(t => t.estado === 'HACER AHORA')?.estado
              || tDia.find(t => t.estado === 'PRÓXIMA')?.estado
              || tDia.find(t => t.estado === 'PROGRAMADA')?.estado

            return (
              <button key={dia.toISOString()}
                onClick={() => setDiaSeleccionado(esSeleccionado ? null : dia)}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors relative
                  ${esHoy ? 'bg-yellow-600 text-gray-900 font-bold' : ''}
                  ${esSeleccionado && !esHoy ? 'bg-gray-700 text-white' : ''}
                  ${!esHoy && !esSeleccionado ? 'hover:bg-gray-800 text-gray-300' : ''}
                `}>
                {format(dia, 'd')}
                {tDia.length > 0 && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5
                    ${estadoMasUrgente === 'VENCIDA' ? 'bg-red-500' : ''}
                    ${estadoMasUrgente === 'HACER AHORA' ? 'bg-orange-500' : ''}
                    ${estadoMasUrgente === 'PRÓXIMA' ? 'bg-yellow-500' : ''}
                    ${estadoMasUrgente === 'PROGRAMADA' ? 'bg-green-500' : ''}
                  `} />
                )}
              </button>
            )
          })}
        </div>

        {/* Tareas del día seleccionado */}
        {diaSeleccionado && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })}
              {' · '}{tareasSeleccionadas().length} tarea{tareasSeleccionadas().length !== 1 ? 's' : ''}
            </h2>

            {tareasSeleccionadas().length === 0 && (
              <div className="text-center py-6 text-gray-600 text-sm">
                Sin términos este día
              </div>
            )}

            <div className="space-y-2">
              {tareasSeleccionadas().map(t => {
                const cfg = estadoConfig(t.estado)
                return (
                  <Link key={t.id} href={`/tarea/${t.id}`}
                    className={`block bg-gray-900 border rounded-lg p-3 hover:border-yellow-600 transition-colors ${cfg.border}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-yellow-600 mb-0.5">{t.direccion}</p>
                        <p className="text-sm text-white font-medium">{t.tarea || t.actividad}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold shrink-0 ${cfg.color}`}>
                        {cfg.dot} {cfg.label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Sin día seleccionado: mostrar próximas tareas del mes */}
        {!diaSeleccionado && (
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Términos del mes
            </h2>
            <div className="space-y-2">
              {tareas
                .filter(t => {
                  if (!t.fecha_limite_efectiva) return false
                  const f = parseISO(t.fecha_limite_efectiva)
                  return f >= startOfMonth(mesActual) && f <= endOfMonth(mesActual)
                })
                .slice(0, 15)
                .map(t => {
                  const cfg = estadoConfig(t.estado)
                  return (
                    <Link key={t.id} href={`/tarea/${t.id}`}
                      className={`block bg-gray-900 border rounded-lg px-3 py-2.5 hover:border-yellow-600 transition-colors ${cfg.border}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 shrink-0 w-10 text-center">
                          {format(parseISO(t.fecha_limite_efectiva!), 'd MMM', { locale: es })}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{t.tarea || t.actividad}</p>
                          <p className="text-xs text-gray-600">{t.direccion}</p>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-semibold shrink-0 ${cfg.color}`}>
                          {cfg.dot}
                        </span>
                      </div>
                    </Link>
                  )
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
