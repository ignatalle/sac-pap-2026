import { addDays, differenceInDays, format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { EstadoTarea, Tarea } from './types'

export function calcularEstado(tarea: Tarea): EstadoTarea {
  if (tarea.porcentaje_avance === 100 || tarea.fecha_real_finalizacion) return 'FINALIZADA'
  if (!tarea.fecha_limite_efectiva) return 'REQUIERE FECHA'

  const hoy = new Date()
  const limite = parseISO(tarea.fecha_limite_efectiva)
  const autoimpuesto = addDays(limite, -tarea.dias_autoimpuestos)
  const inicioPre = addDays(autoimpuesto, -tarea.dias_preparacion)
  const diasRestantes = differenceInDays(limite, hoy)

  if (diasRestantes < 0) return 'VENCIDA'
  if (hoy >= inicioPre && hoy < autoimpuesto) return 'HACER AHORA'
  if (hoy >= autoimpuesto && hoy <= limite) return 'HACER AHORA'
  if (differenceInDays(inicioPre, hoy) <= 7) return 'PRÓXIMA'
  return 'PROGRAMADA'
}

export function calcularFechas(tarea: Tarea) {
  if (!tarea.fecha_limite_efectiva) return { termino_autoimpuesto: null, inicio_preparacion: null }
  const limite = parseISO(tarea.fecha_limite_efectiva)
  const auto = addDays(limite, -tarea.dias_autoimpuestos)
  const inicio = addDays(auto, -tarea.dias_preparacion)
  return {
    termino_autoimpuesto: format(auto, 'yyyy-MM-dd'),
    inicio_preparacion: format(inicio, 'yyyy-MM-dd'),
  }
}

export function estadoConfig(estado: EstadoTarea) {
  switch (estado) {
    case 'VENCIDA':
      return { color: 'bg-red-900 text-red-100', dot: '🔴', label: 'VENCIDA', border: 'border-red-800' }
    case 'HACER AHORA':
      return { color: 'bg-orange-800 text-orange-100', dot: '🟠', label: 'HACER AHORA', border: 'border-orange-600' }
    case 'PRÓXIMA':
      return { color: 'bg-yellow-800 text-yellow-100', dot: '🟡', label: 'PRÓXIMA', border: 'border-yellow-600' }
    case 'PROGRAMADA':
      return { color: 'bg-green-900 text-green-100', dot: '🟢', label: 'PROGRAMADA', border: 'border-green-800' }
    case 'FINALIZADA':
      return { color: 'bg-blue-900 text-blue-100', dot: '✅', label: 'FINALIZADA', border: 'border-blue-800' }
    default:
      return { color: 'bg-gray-800 text-gray-300', dot: '⚪', label: 'REQUIERE FECHA', border: 'border-gray-600' }
  }
}

export function formatFecha(fecha: string | null | undefined): string {
  if (!fecha) return '—'
  try {
    return format(parseISO(fecha), "dd MMM yyyy", { locale: es })
  } catch {
    return fecha
  }
}
