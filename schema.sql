-- ============================================
-- SAC-PAP 2026 — Schema Supabase
-- Ejecutar en Supabase > SQL Editor
-- ============================================

-- Tabla principal de tareas
CREATE TABLE tareas_pap (
  id                      INTEGER PRIMARY KEY,
  direccion               TEXT,
  actividad               TEXT,
  tarea                   TEXT,
  observaciones           TEXT,
  termino_pap_texto       TEXT,
  fecha_pap_inicio        DATE,
  fecha_pap_fin           DATE,
  tipo_termino            TEXT DEFAULT 'fecha',
  fecha_limite_efectiva   DATE,
  dias_autoimpuestos      INTEGER DEFAULT 10,
  dias_preparacion        INTEGER DEFAULT 7,
  porcentaje_avance       INTEGER DEFAULT 0 CHECK (porcentaje_avance BETWEEN 0 AND 100),
  dependencia             TEXT,
  documento               TEXT DEFAULT 'REDOAPE',
  estado                  TEXT DEFAULT 'PROGRAMADA',
  dias_restantes          INTEGER,
  responsable             TEXT,
  prioridad               TEXT DEFAULT 'NORMAL',
  -- Campos editables por el usuario
  fecha_real_inicio       DATE,
  fecha_real_finalizacion DATE,
  observaciones_control   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración global del usuario
CREATE TABLE config_usuario (
  id                          INTEGER PRIMARY KEY DEFAULT 1,
  dias_autoimpuestos_default  INTEGER DEFAULT 10,
  dias_preparacion_default    INTEGER DEFAULT 7,
  notificaciones_activas      BOOLEAN DEFAULT FALSE,
  hora_notificacion           TEXT DEFAULT '08:00',
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar config por defecto
INSERT INTO config_usuario (id) VALUES (1) ON CONFLICT DO NOTHING;

-- RLS: Solo el usuario autenticado puede leer/escribir
ALTER TABLE tareas_pap ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_usuario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth_only_tareas" ON tareas_pap
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "auth_only_config" ON config_usuario
  FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tareas_updated_at
  BEFORE UPDATE ON tareas_pap
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índices útiles
CREATE INDEX idx_tareas_estado ON tareas_pap(estado);
CREATE INDEX idx_tareas_fecha ON tareas_pap(fecha_limite_efectiva);
CREATE INDEX idx_tareas_prioridad ON tareas_pap(prioridad);
