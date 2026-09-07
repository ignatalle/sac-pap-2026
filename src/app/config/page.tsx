'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'
import { Bell, BellOff, Shield, Clock, Smartphone } from 'lucide-react'

export default function Configuracion() {
  const router = useRouter()
  const [diasAuto, setDiasAuto] = useState(10)
  const [diasPrep, setDiasPrep] = useState(7)
  const [notifActivas, setNotifActivas] = useState(false)
  const [saving, setSaving] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [pwaInstalable, setPwaInstalable] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) { router.push('/'); return }

      const { data } = await supabase
        .from('config_usuario')
        .select('*')
        .single()
      if (data) {
        setDiasAuto(data.dias_autoimpuestos_default)
        setDiasPrep(data.dias_preparacion_default)
      }

      // Check notification permission
      if ('Notification' in window) {
        setNotifActivas(Notification.permission === 'granted')
      }
    }
    load()

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setPwaInstalable(true)
    })
  }, [router])

  async function guardar() {
    setSaving(true)
    await supabase.from('config_usuario').upsert({
      id: 1,
      dias_autoimpuestos_default: diasAuto,
      dias_preparacion_default: diasPrep,
    })
    setSaving(false)
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  async function activarNotificaciones() {
    if (!('Notification' in window)) {
      alert('Tu navegador no soporta notificaciones')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm === 'granted') {
      setNotifActivas(true)
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        await reg.showNotification('SAC-PAP 2026', {
          body: '✅ Notificaciones activadas correctamente',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        })
      }
    }
  }

  async function instalarApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setPwaInstalable(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <NavBar />
      <main className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6 space-y-4">

        <div className="mb-6">
          <h1 className="text-xl font-bold text-white">Configuración</h1>
          <p className="text-gray-500 text-sm">Valores globales del sistema</p>
        </div>

        {/* Días por defecto */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Clock size={14} /> Anticipación por defecto
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Se aplica a todas las tareas que no tengan configuración individual.
          </p>

          <div className="space-y-4">
            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Días autoimpuestos</span>
                <span className="text-sm font-bold text-yellow-400">{diasAuto} días</span>
              </label>
              <input type="range" min={1} max={30} value={diasAuto}
                onChange={e => setDiasAuto(Number(e.target.value))}
                className="w-full accent-yellow-500" />
              <p className="text-xs text-gray-600 mt-1">
                Terminarás {diasAuto} días antes del término PAP
              </p>
            </div>

            <div>
              <label className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Días de preparación</span>
                <span className="text-sm font-bold text-yellow-400">{diasPrep} días</span>
              </label>
              <input type="range" min={1} max={30} value={diasPrep}
                onChange={e => setDiasPrep(Number(e.target.value))}
                className="w-full accent-yellow-500" />
              <p className="text-xs text-gray-600 mt-1">
                El sistema te avisará {diasPrep} días antes del término autoimpuesto
              </p>
            </div>
          </div>

          {/* Timeline visual */}
          <div className="mt-4 bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-2">Línea de tiempo resultante:</p>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-green-400">Inicio prep.</span>
              <span className="text-gray-600">──{diasPrep}d──</span>
              <span className="text-yellow-400">Término auto.</span>
              <span className="text-gray-600">──{diasAuto}d──</span>
              <span className="text-red-400">Término PAP</span>
            </div>
          </div>

          <button onClick={guardar} disabled={saving}
            className={`w-full mt-4 py-2.5 rounded-lg font-semibold text-sm transition-colors
              ${guardado ? 'bg-green-700 text-white' : 'bg-yellow-600 hover:bg-yellow-500 text-gray-900'}`}>
            {guardado ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>

        {/* Notificaciones */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bell size={14} /> Notificaciones
          </h2>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-white">Estado</p>
              <p className="text-xs text-gray-500">
                {notifActivas ? 'Activas — recibirás alertas diarias' : 'Inactivas'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${notifActivas ? 'bg-green-500' : 'bg-gray-600'}`} />
          </div>

          {!notifActivas && (
            <button onClick={activarNotificaciones}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors">
              <Bell size={16} /> Activar notificaciones
            </button>
          )}
          {notifActivas && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Bell size={16} /> Recibirás un aviso diario con las tareas urgentes
            </div>
          )}
        </div>

        {/* PWA Install */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Smartphone size={14} /> Instalar en el celular
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Instalá la app en tu celular para acceder sin internet y recibir notificaciones nativas.
          </p>
          {pwaInstalable ? (
            <button onClick={instalarApp}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-gray-900 rounded-lg text-sm font-semibold transition-colors">
              <Smartphone size={16} /> Instalar SAC-PAP
            </button>
          ) : (
            <div className="text-xs text-gray-600 bg-gray-800 rounded-lg p-3">
              <p className="font-semibold mb-1">Instalación manual:</p>
              <p>Chrome → menú (⋮) → &quot;Agregar a pantalla de inicio&quot;</p>
            </div>
          )}
        </div>

        {/* Info sistema */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Shield size={14} /> Sistema
          </h2>
          <div className="space-y-1 text-xs text-gray-500">
            <p>SAC-PAP 2026 v1.0</p>
            <p>PAP 2026 — 264 tareas cargadas</p>
            <p>Dir. Gral. de Personal y Bienestar — EMGE</p>
            <p>Firmado: MY GERVASONI LEONARDO</p>
          </div>
        </div>
      </main>
    </div>
  )
}
