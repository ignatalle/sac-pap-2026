'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import EstadoBadge from '@/components/EstadoBadge'
import { supabase } from '@/lib/supabase'
import { calcularEstado, calcularFechas, formatFecha } from '@/lib/utils'
import type { Tarea, EstadoTarea } from '@/lib/types'
import { ArrowLeft, Save, BookOpen, Calendar, Clock, User } from 'lucide-react'

export default function DetalleTarea() {
  const router = useRouter()
  const { id } = useParams()
  const [tarea, setTarea] = useState<Tarea | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guardado, setGuardado] = useState(false)

  // Campos editables
  const [pct, setPct] = useState(0)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [notas, setNotas] = useState('')
  const [diasAuto, setDiasAuto] = useState(10)
  const [diasPrep, setDiasPrep] = useState(7)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) { router.push('/'); return }
      const { data } = await supabase.from('tareas_pap').select('*').eq('id', id).single()
      if (!data) return
      const t = { ...data, estado: calcularEstado(data) as EstadoTarea }
      setTarea(t)
      setPct(t.porcentaje_avance || 0)
      setFechaInicio(t.fecha_real_inicio || '')
      setFechaFin(t.fecha_real_finalizacion || '')
      setNotas(t.observaciones_control || '')
      setDiasAuto(t.dias_autoimpuestos || 10)
      setDiasPrep(t.dias_preparacion || 7)
      setLoading(false)
    }
    load()
  }, [id, router])

  async function guardar() {
    setSaving(true)
    await supabase.from('tareas_pap').update({
      porcentaje_avance: pct,
      fecha_real_inicio: fechaInicio || null,
      fecha_real_finalizacion: fechaFin || null,
      observaciones_control: notas,
      dias_autoimpuestos: diasAuto,
      dias_preparacion: diasPrep,
    }).eq('id', id)
    setSaving(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-500 animate-pulse">Cargando tarea...</div>
    </div>
  )
  if (!tarea) return <div className="p-4 text-red-400">Tarea no encontrada</div>

  const fechas = calcularFechas({ ...tarea, dias_autoimpuestos: diasAuto, dias_preparacion: diasPrep })

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">

        {/* Back */}
        <Link href="/agenda" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Volver a agenda
        </Link>

        {/* Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <EstadoBadge estado={tarea.estado} />
            <span className="text-xs text-gray-600">#{tarea.id}</span>
          </div>
          <p className="text-xs text-yellow-600 font-medium mb-1">{tarea.direccion}</p>
          <h1 className="text-base font-bold text-white mb-1">{tarea.actividad}</h1>
          <p className="text-sm text-gray-300">{tarea.tarea}</p>
        </div>

        {/* Fechas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar size={14} /> Línea de tiempo
          </h2>
          <div className="space-y-2">
            {[
              { label: 'Término PAP', value: tarea.termino_pap_texto, color: 'text-red-400' },
              { label: 'Límite efectivo', value: formatFecha(tarea.fecha_limite_efectiva), color: 'text-orange-400' },
              { label: 'Término autoimpuesto', value: formatFecha(fechas.termino_autoimpuesto), color: 'text-yellow-400' },
              { label: 'Inicio de preparación', value: formatFecha(fechas.inicio_preparacion), color: 'text-green-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-xs font-semibold ${color}`}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* REDOAPE */}
        <div className="bg-gray-900 border border-blue-900 rounded-xl p-4 mb-4">
          <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookOpen size={14} /> Procedimiento / REDOAPE
          </h2>
          {tarea.observaciones && (
            <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed mb-3">
              {tarea.observaciones}
            </p>
          )}
          <a
            href={`/redoape.html?page=${(tarea as any).redoape_pagina || 1}&ref=${encodeURIComponent(tarea.actividad || '')}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 rounded-lg text-sm font-semibold text-white transition-colors">
            <BookOpen size={16} />
            {(tarea as any).redoape_pagina
              ? `Ver procedimiento — Pág. ${(tarea as any).redoape_pagina}`
              : 'Ver REDOAPE 2026'}
          </a>
          {(tarea as any).redoape_pagina && (
            <p className="text-xs text-blue-400/60 mt-2 text-center">
              Abre en la página exacta del procedimiento
            </p>
          )}
        </div>

        {/* Config días */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock size={14} /> Anticipación
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Días autoimpuestos</label>
              <input type="number" min={0} max={60} value={diasAuto}
                onChange={e => setDiasAuto(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Días preparación</label>
              <input type="number" min={0} max={60} value={diasPrep}
                onChange={e => setDiasPrep(Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" />
            </div>
          </div>
        </div>

        {/* Progreso */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <User size={14} /> Seguimiento
          </h2>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-2">Avance: {pct}%</label>
            <input type="range" min={0} max={100} step={5} value={pct}
              onChange={e => setPct(Number(e.target.value))}
              className="w-full accent-yellow-500" />
            <div className="flex gap-1 mt-2">
              {[0, 25, 50, 75, 100].map(v => (
                <button key={v} onClick={() => setPct(v)}
                  className={`flex-1 py-1 rounded text-xs font-medium transition-colors
                    ${pct === v ? 'bg-yellow-600 text-gray-900' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}>
                  {v}%
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Inicio real</label>
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Finalización real</label>
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Observaciones de control</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={3}
              placeholder="Notas de seguimiento..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white resize-none" />
          </div>
        </div>

        {/* Guardar */}
        <button onClick={guardar} disabled={saving}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors
            ${guardado ? 'bg-green-700 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-gray-900'}`}>
          <Save size={16} />
          {guardado ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </main>
    </div>
  )
}
