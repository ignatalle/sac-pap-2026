export type EstadoTarea =
  | 'PROGRAMADA'
  | 'PRÓXIMA'
  | 'HACER AHORA'
  | 'VENCIDA'
  | 'REQUIERE FECHA'
  | 'FINALIZADA'

export interface Tarea {
  id: number
  direccion: string
  actividad: string
  tarea: string
  observaciones: string
  termino_pap_texto: string
  fecha_pap_inicio: string | null
  fecha_pap_fin: string | null
  tipo_termino: string
  fecha_limite_efectiva: string | null
  dias_autoimpuestos: number
  dias_preparacion: number
  porcentaje_avance: number
  dependencia: string
  documento: string
  estado: EstadoTarea
  dias_restantes: number | null
  responsable: string
  prioridad: string
  // Campos editables (guardados en Supabase)
  fecha_real_inicio?: string | null
  fecha_real_finalizacion?: string | null
  observaciones_control?: string
  // Calculados en runtime
  termino_autoimpuesto?: string | null
  inicio_preparacion?: string | null
}

export interface ConfigUsuario {
  dias_autoimpuestos_default: number
  dias_preparacion_default: number
}
