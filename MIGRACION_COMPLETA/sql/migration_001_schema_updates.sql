-- =====================================================
-- MIGRATION 001: SCHEMA UPDATES PARA MIGRACIÓN
-- =====================================================
-- Fecha: 2026-08-02
-- Propósito: Preparar schema para migración desde Excel
-- Ejecutar ANTES de la migración de datos
-- =====================================================

-- =====================================================
-- 1. AGREGAR CAMPOS FALTANTES EN PERSONAS
-- =====================================================

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS direccion_completa TEXT,
  ADD COLUMN IF NOT EXISTS folio_legacy VARCHAR(50);

COMMENT ON COLUMN personas.direccion_completa IS 'Dirección completa desde Excel (sin parsear)';
COMMENT ON COLUMN personas.folio_legacy IS 'Folio del sistema anterior (si existe)';

-- =====================================================
-- 2. AGREGAR CAMPOS FALTANTES EN GRUPOS
-- =====================================================

ALTER TABLE grupos
  ADD COLUMN IF NOT EXISTS folio_legacy VARCHAR(50),
  ADD COLUMN IF NOT EXISTS numero_integrantes INTEGER,
  ADD COLUMN IF NOT EXISTS ciclo_actual INTEGER DEFAULT 1;

COMMENT ON COLUMN grupos.folio_legacy IS 'Número de grupo del sistema anterior (ej: "# GPO" de Excel)';
COMMENT ON COLUMN grupos.numero_integrantes IS 'Número total de integrantes en el grupo';
COMMENT ON COLUMN grupos.ciclo_actual IS 'Ciclo actual del grupo';

-- =====================================================
-- 3. AGREGAR CAMPOS FALTANTES EN EXPEDIENTES
-- =====================================================

ALTER TABLE expedientes
  ADD COLUMN IF NOT EXISTS ciclo_numero INTEGER DEFAULT 1;

COMMENT ON COLUMN expedientes.ciclo_numero IS 'Número de ciclo del expediente (derivado de integrantes)';

-- =====================================================
-- 4. AGREGAR CAMPOS FALTANTES EN INTEGRANTES
-- =====================================================

ALTER TABLE integrantes
  ADD COLUMN IF NOT EXISTS ciclo INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS es_tesorera BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN integrantes.ciclo IS 'Ciclo individual del integrante en el grupo';
COMMENT ON COLUMN integrantes.es_tesorera IS 'Indica si es tesorera del grupo';

-- =====================================================
-- 5. CREAR TABLA CREDITOS (SI NO EXISTE)
-- =====================================================

CREATE TABLE IF NOT EXISTS creditos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio VARCHAR(50),

  -- Relaciones
  expediente_id UUID NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,
  ciclo_id UUID REFERENCES ciclos(id) ON DELETE SET NULL,

  -- Datos financieros básicos
  monto_prestamo NUMERIC(12,2) NOT NULL CHECK (monto_prestamo > 0),
  monto_total NUMERIC(12,2) NOT NULL CHECK (monto_total >= monto_prestamo),
  tasa INTEGER NOT NULL CHECK (tasa > 0),
  plazo_semanas INTEGER NOT NULL CHECK (plazo_semanas > 0),
  pago_semanal NUMERIC(10,2) NOT NULL CHECK (pago_semanal > 0),

  -- Fechas
  fecha_desembolso DATE,
  semana_desembolso INTEGER,
  fecha_vencimiento DATE,
  semana_vencimiento INTEGER,

  -- Costos adicionales
  retencion_inicial NUMERIC(10,2) DEFAULT 0,
  costo_apertura NUMERIC(10,2) DEFAULT 0,
  seguro_persona NUMERIC(10,2) DEFAULT 0,
  monto_seguro NUMERIC(10,2) DEFAULT 0,

  -- Estado del crédito
  total_pagado NUMERIC(12,2) DEFAULT 0 CHECK (total_pagado >= 0),
  saldo_pendiente NUMERIC(12,2) DEFAULT 0 CHECK (saldo_pendiente >= 0),
  estado VARCHAR(20) DEFAULT 'VIGENTE' CHECK (estado IN ('VIGENTE', 'LIQUIDADO', 'VENCIDO', 'CANCELADO')),

  -- Auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT creditos_fechas_validas CHECK (
    fecha_vencimiento IS NULL OR
    fecha_desembolso IS NULL OR
    fecha_vencimiento >= fecha_desembolso
  )
);

COMMENT ON TABLE creditos IS 'Créditos otorgados a grupos/expedientes';
COMMENT ON COLUMN creditos.monto_prestamo IS 'Monto del préstamo inicial';
COMMENT ON COLUMN creditos.monto_total IS 'Monto total a pagar (incluye intereses)';
COMMENT ON COLUMN creditos.tasa IS 'Tasa de interés aplicada (porcentaje)';
COMMENT ON COLUMN creditos.plazo_semanas IS 'Plazo del crédito en semanas';
COMMENT ON COLUMN creditos.pago_semanal IS 'Monto del pago semanal esperado';
COMMENT ON COLUMN creditos.total_pagado IS 'Total pagado hasta la fecha';
COMMENT ON COLUMN creditos.saldo_pendiente IS 'Saldo pendiente por pagar';

-- =====================================================
-- 6. CREAR ÍNDICES PARA OPTIMIZAR MIGRACION
-- =====================================================

-- Índices en personas
CREATE INDEX IF NOT EXISTS idx_personas_curp ON personas(curp) WHERE curp IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personas_telefono ON personas(telefono) WHERE telefono IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personas_created_at ON personas(created_at);

-- Índices en grupos
CREATE INDEX IF NOT EXISTS idx_grupos_nombre ON grupos(nombre);
CREATE INDEX IF NOT EXISTS idx_grupos_folio_legacy ON grupos(folio_legacy) WHERE folio_legacy IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grupos_estado ON grupos(estado);

-- Índices en expedientes
CREATE INDEX IF NOT EXISTS idx_expedientes_grupo_id ON expedientes(grupo_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_asesora_id ON expedientes(asesora_id) WHERE asesora_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado);

-- Índices en integrantes
CREATE INDEX IF NOT EXISTS idx_integrantes_persona_id ON integrantes(persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_integrantes_expediente_id ON integrantes(expediente_id);
CREATE INDEX IF NOT EXISTS idx_integrantes_tesorera ON integrantes(es_tesorera) WHERE es_tesorera = TRUE;
CREATE INDEX IF NOT EXISTS idx_integrantes_estado ON integrantes(estado);

-- Índices en créditos
CREATE INDEX IF NOT EXISTS idx_creditos_expediente_id ON creditos(expediente_id);
CREATE INDEX IF NOT EXISTS idx_creditos_estado ON creditos(estado);
CREATE INDEX IF NOT EXISTS idx_creditos_fecha_desembolso ON creditos(fecha_desembolso) WHERE fecha_desembolso IS NOT NULL;

-- =====================================================
-- 7. CREAR TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para creditos.updated_at
CREATE OR REPLACE FUNCTION update_creditos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER creditos_updated_at_trigger
  BEFORE UPDATE ON creditos
  FOR EACH ROW
  EXECUTE FUNCTION update_creditos_updated_at();

-- =====================================================
-- 8. AGREGAR CONSTRAINTS ADICIONALES
-- =====================================================

-- Evitar duplicados: mismo grupo con mismo folio_legacy
CREATE UNIQUE INDEX IF NOT EXISTS idx_grupos_folio_legacy_unique
  ON grupos(folio_legacy)
  WHERE folio_legacy IS NOT NULL AND deleted_at IS NULL;

-- Evitar duplicados: misma persona en mismo expediente (permitir múltiples ciclos)
-- NOTA: Este constraint se comenta porque una persona puede estar en múltiples ciclos
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_integrantes_persona_expediente_unique
--   ON integrantes(persona_id, expediente_id)
--   WHERE persona_id IS NOT NULL;

-- =====================================================
-- 9. ESTADÍSTICAS Y ANÁLISIS
-- =====================================================

-- Actualizar estadísticas de tablas para mejor rendimiento
ANALYZE personas;
ANALYZE grupos;
ANALYZE expedientes;
ANALYZE integrantes;

-- =====================================================
-- 10. VERIFICACIÓN
-- =====================================================

-- Verificar que las columnas se agregaron correctamente
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar personas.direccion_completa
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_name = 'personas' AND column_name = 'direccion_completa';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'ERROR: Campo personas.direccion_completa no se creó';
  END IF;

  -- Verificar integrantes.es_tesorera
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_name = 'integrantes' AND column_name = 'es_tesorera';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'ERROR: Campo integrantes.es_tesorera no se creó';
  END IF;

  -- Verificar tabla creditos
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_name = 'creditos';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'ERROR: Tabla creditos no se creó';
  END IF;

  RAISE NOTICE 'MIGRATION 001: Verificación exitosa. Todas las estructuras se crearon correctamente.';
END $$;

-- =====================================================
-- FIN DE MIGRATION 001
-- =====================================================
