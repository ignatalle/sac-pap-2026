import { estadoConfig } from '@/lib/utils'
import type { EstadoTarea } from '@/lib/types'

export default function EstadoBadge({ estado }: { estado: EstadoTarea }) {
  const cfg = estadoConfig(estado)
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${cfg.color}`}>
      {cfg.dot} {cfg.label}
    </span>
  )
}
