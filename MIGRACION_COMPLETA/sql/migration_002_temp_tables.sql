-- =====================================================
-- MIGRATION 002: TABLAS TEMPORALES PARA MIGRACIÓN
-- =====================================================
-- Fecha: 2026-08-02
-- Propósito: Crear tablas de staging y mapeo para migración
-- Ejecutar DESPUÉS de migration_001
-- =====================================================

-- =====================================================
-- 1. SCHEMA TEMPORAL
-- =====================================================

-- Crear schema para staging (opcional, ayuda a organizar)
CREATE SCHEMA IF NOT EXISTS staging;

COMMENT ON SCHEMA staging IS 'Schema temporal para migración de datos desde Excel';

-- =====================================================
-- 2. TABLA STAGING: PERSONAS
-- =====================================================

DROP TABLE IF EXISTS staging.personas_raw CASCADE;

CREATE TABLE staging.personas_raw (
  id SERIAL PRIMARY KEY,

  -- Datos desde Excel
  nombre_completo VARCHAR(255),
  curp VARCHAR(18),
  telefono VARCHAR(20),
  direccion VARCHAR(500),
  monto_solicitado_texto VARCHAR(50),

  -- Datos procesados
  primer_nombre VARCHAR(50),
  segundo_nombre VARCHAR(50),
  apellido_pat VARCHAR(50),
  apellido_mat VARCHAR(50),
  monto_solicitado NUMERIC(10,2),
  fecha_nac DATE,
  genero VARCHAR(15),

  -- Metadatos
  archivo_origen VARCHAR(100),
  hoja_origen VARCHAR(50),
  fila_origen INTEGER,

  -- Estado de procesamiento
  procesado BOOLEAN DEFAULT FALSE,
  errores TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging.personas_raw IS 'Datos crudos de personas desde Excel';

CREATE INDEX idx_staging_personas_curp ON staging.personas_raw(curp);
CREATE INDEX idx_staging_personas_procesado ON staging.personas_raw(procesado);

-- =====================================================
-- 3. TABLA STAGING: GRUPOS
-- =====================================================

DROP TABLE IF EXISTS staging.grupos_raw CASCADE;

CREATE TABLE staging.grupos_raw (
  id SERIAL PRIMARY KEY,

  -- Datos desde Excel
  nombre VARCHAR(255),
  folio_legacy VARCHAR(50),

  -- Datos procesados
  nombre_normalizado VARCHAR(255),

  -- Metadatos
  archivo_origen VARCHAR(100),
  num_integrantes INTEGER DEFAULT 0,

  -- Estado de procesamiento
  procesado BOOLEAN DEFAULT FALSE,
  errores TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging.grupos_raw IS 'Datos crudos de grupos desde Excel';

CREATE INDEX idx_staging_grupos_nombre ON staging.grupos_raw(nombre);
CREATE INDEX idx_staging_grupos_procesado ON staging.grupos_raw(procesado);

-- =====================================================
-- 4. TABLA STAGING: INTEGRANTES
-- =====================================================

DROP TABLE IF EXISTS staging.integrantes_raw CASCADE;

CREATE TABLE staging.integrantes_raw (
  id SERIAL PRIMARY KEY,

  -- Identificadores desde Excel
  curp VARCHAR(18),
  nombre_grupo VARCHAR(255),

  -- Datos desde Excel
  ciclo INTEGER,
  papeleria_completa VARCHAR(10),
  asesora_nombre VARCHAR(100),

  -- Estado de procesamiento
  procesado BOOLEAN DEFAULT FALSE,
  errores TEXT,

  -- Metadatos
  archivo_origen VARCHAR(100),
  hoja_origen VARCHAR(50),
  fila_origen INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging.integrantes_raw IS 'Datos crudos de integrantes desde Excel';

CREATE INDEX idx_staging_integrantes_curp ON staging.integrantes_raw(curp);
CREATE INDEX idx_staging_integrantes_grupo ON staging.integrantes_raw(nombre_grupo);
CREATE INDEX idx_staging_integrantes_procesado ON staging.integrantes_raw(procesado);

-- =====================================================
-- 5. TABLA STAGING: TESORERAS
-- =====================================================

DROP TABLE IF EXISTS staging.tesoreras_raw CASCADE;

CREATE TABLE staging.tesoreras_raw (
  id SERIAL PRIMARY KEY,

  curp VARCHAR(18) NOT NULL,
  nombre VARCHAR(255),
  grupo VARCHAR(255),

  procesado BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging.tesoreras_raw IS 'Lista de tesoreras desde Excel';

CREATE INDEX idx_staging_tesoreras_curp ON staging.tesoreras_raw(curp);

-- =====================================================
-- 6. TABLA STAGING: CRÉDITOS
-- =====================================================

DROP TABLE IF EXISTS staging.creditos_raw CASCADE;

CREATE TABLE staging.creditos_raw (
  id SERIAL PRIMARY KEY,

  -- Identificadores desde Excel
  numero_grupo VARCHAR(50),
  nombre_grupo VARCHAR(255),
  ciclo INTEGER,

  -- Datos financieros (texto crudo)
  monto_prestamo_texto VARCHAR(50),
  monto_total_texto VARCHAR(50),
  tasa_texto VARCHAR(20),
  plazo_texto VARCHAR(20),
  pago_semanal_texto VARCHAR(50),
  retencion_inicial_texto VARCHAR(50),
  costo_apertura_texto VARCHAR(50),

  -- Datos financieros (procesados)
  monto_prestamo NUMERIC(12,2),
  monto_total NUMERIC(12,2),
  tasa INTEGER,
  plazo_semanas INTEGER,
  pago_semanal NUMERIC(10,2),
  retencion_inicial NUMERIC(10,2),
  costo_apertura NUMERIC(10,2),

  -- Fechas (texto crudo)
  fecha_desembolso_texto VARCHAR(50),
  fecha_vencimiento_texto VARCHAR(50),

  -- Fechas (procesadas)
  fecha_desembolso DATE,
  fecha_vencimiento DATE,
  semana_desembolso INTEGER,
  semana_vencimiento INTEGER,

  -- Estado de procesamiento
  procesado BOOLEAN DEFAULT FALSE,
  errores TEXT,

  -- Metadatos
  archivo_origen VARCHAR(100),
  fila_origen INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging.creditos_raw IS 'Datos crudos de créditos desde SEM 364';

CREATE INDEX idx_staging_creditos_grupo ON staging.creditos_raw(nombre_grupo);
CREATE INDEX idx_staging_creditos_procesado ON staging.creditos_raw(procesado);

-- =====================================================
-- 7. TABLA DE MAPEO: GRUPOS LEGACY
-- =====================================================

DROP TABLE IF EXISTS staging.mapeo_grupos CASCADE;

CREATE TABLE staging.mapeo_grupos (
  id SERIAL PRIMARY KEY,

  -- Datos legacy
  nombre_legacy VARCHAR(255) NOT NULL,
  folio_legacy VARCHAR(50),

  -- UUID en nuevo sistema
  grupo_uuid UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging.mapeo_grupos IS 'Mapeo entre grupos legacy y UUIDs del nuevo sistema';

CREATE UNIQUE INDEX idx_mapeo_grupos_nombre ON staging.mapeo_grupos(nombre_legacy);
CREATE INDEX idx_mapeo_grupos_uuid ON staging.mapeo_grupos(grupo_uuid);

-- =====================================================
-- 8. TABLA DE MAPEO: PERSONAS LEGACY
-- =====================================================

DROP TABLE IF EXISTS staging.mapeo_personas CASCADE;

CREATE TABLE staging.mapeo_personas (
  id SERIAL PRIMARY KEY,

  -- Datos legacy
  curp VARCHAR(18) NOT NULL UNIQUE,
  nombre_legacy VARCHAR(255),

  -- UUID en nuevo sistema
  persona_uuid UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging.mapeo_personas IS 'Mapeo entre CURPs y UUIDs del nuevo sistema';

CREATE UNIQUE INDEX idx_mapeo_personas_curp ON staging.mapeo_personas(curp);
CREATE INDEX idx_mapeo_personas_uuid ON staging.mapeo_personas(persona_uuid);

-- =====================================================
-- 9. TABLA DE MAPEO: EXPEDIENTES
-- =====================================================

DROP TABLE IF EXISTS staging.mapeo_expedientes CASCADE;

CREATE TABLE staging.mapeo_expedientes (
  id SERIAL PRIMARY KEY,

  -- Datos legacy
  nombre_grupo VARCHAR(255) NOT NULL,

  -- UUIDs en nuevo sistema
  grupo_uuid UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
  expediente_uuid UUID NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging.mapeo_expedientes IS 'Mapeo entre grupos y expedientes';

CREATE INDEX idx_mapeo_expedientes_grupo ON staging.mapeo_expedientes(nombre_grupo);
CREATE INDEX idx_mapeo_expedientes_grupo_uuid ON staging.mapeo_expedientes(grupo_uuid);
CREATE INDEX idx_mapeo_expedientes_exp_uuid ON staging.mapeo_expedientes(expediente_uuid);

-- =====================================================
-- 10. TABLA DE LOG: ERRORES DE MIGRACIÓN
-- =====================================================

DROP TABLE IF EXISTS staging.migration_errors CASCADE;

CREATE TABLE staging.migration_errors (
  id SERIAL PRIMARY KEY,

  -- Origen del error
  fase VARCHAR(50) NOT NULL,
  tabla_origen VARCHAR(100),
  registro_id INTEGER,

  -- Detalles del error
  error_tipo VARCHAR(50),
  error_mensaje TEXT NOT NULL,
  datos_afectados JSONB,

  -- Estado
  resuelto BOOLEAN DEFAULT FALSE,
  resolucion TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE staging.migration_errors IS 'Log de errores durante la migración';

CREATE INDEX idx_migration_errors_fase ON staging.migration_errors(fase);
CREATE INDEX idx_migration_errors_resuelto ON staging.migration_errors(resuelto);
CREATE INDEX idx_migration_errors_created ON staging.migration_errors(created_at);

-- =====================================================
-- 11. TABLA DE LOG: ESTADÍSTICAS DE MIGRACIÓN
-- =====================================================

DROP TABLE IF EXISTS staging.migration_stats CASCADE;

CREATE TABLE staging.migration_stats (
  id SERIAL PRIMARY KEY,

  -- Identificación
  fase VARCHAR(50) NOT NULL,
  tabla VARCHAR(100) NOT NULL,

  -- Estadísticas
  total_procesados INTEGER DEFAULT 0,
  total_exitosos INTEGER DEFAULT 0,
  total_fallidos INTEGER DEFAULT 0,

  -- Tiempos
  inicio_proceso TIMESTAMPTZ,
  fin_proceso TIMESTAMPTZ,
  duracion_segundos INTEGER,

  -- Metadata adicional
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staging.migration_stats IS 'Estadísticas de cada fase de migración';

CREATE INDEX idx_migration_stats_fase ON staging.migration_stats(fase);
CREATE INDEX idx_migration_stats_tabla ON staging.migration_stats(tabla);

-- =====================================================
-- 12. FUNCIONES AUXILIARES
-- =====================================================

-- Función para registrar error de migración
CREATE OR REPLACE FUNCTION staging.log_migration_error(
  p_fase VARCHAR,
  p_tabla VARCHAR,
  p_registro_id INTEGER,
  p_error_tipo VARCHAR,
  p_error_mensaje TEXT,
  p_datos_afectados JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_error_id INTEGER;
BEGIN
  INSERT INTO staging.migration_errors (
    fase, tabla_origen, registro_id, error_tipo, error_mensaje, datos_afectados
  ) VALUES (
    p_fase, p_tabla, p_registro_id, p_error_tipo, p_error_mensaje, p_datos_afectados
  )
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$ LANGUAGE plpgsql;

-- Función para iniciar estadísticas de fase
CREATE OR REPLACE FUNCTION staging.start_migration_phase(
  p_fase VARCHAR,
  p_tabla VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_stat_id INTEGER;
BEGIN
  INSERT INTO staging.migration_stats (fase, tabla, inicio_proceso)
  VALUES (p_fase, p_tabla, NOW())
  RETURNING id INTO v_stat_id;

  RETURN v_stat_id;
END;
$$ LANGUAGE plpgsql;

-- Función para finalizar estadísticas de fase
CREATE OR REPLACE FUNCTION staging.end_migration_phase(
  p_stat_id INTEGER,
  p_total_procesados INTEGER,
  p_total_exitosos INTEGER,
  p_total_fallidos INTEGER,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE staging.migration_stats
  SET
    fin_proceso = NOW(),
    duracion_segundos = EXTRACT(EPOCH FROM (NOW() - inicio_proceso))::INTEGER,
    total_procesados = p_total_procesados,
    total_exitosos = p_total_exitosos,
    total_fallidos = p_total_fallidos,
    metadata = p_metadata
  WHERE id = p_stat_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 13. VERIFICACIÓN
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Verificar schema staging
  SELECT COUNT(*) INTO v_count
  FROM information_schema.schemata
  WHERE schema_name = 'staging';

  IF v_count = 0 THEN
    RAISE EXCEPTION 'ERROR: Schema staging no se creó';
  END IF;

  -- Verificar tablas principales
  SELECT COUNT(*) INTO v_count
  FROM information_schema.tables
  WHERE table_schema = 'staging'
    AND table_name IN ('personas_raw', 'grupos_raw', 'integrantes_raw', 'mapeo_grupos', 'mapeo_personas');

  IF v_count < 5 THEN
    RAISE EXCEPTION 'ERROR: No todas las tablas staging se crearon (esperadas: 5, encontradas: %)', v_count;
  END IF;

  RAISE NOTICE 'MIGRATION 002: Verificación exitosa. Todas las tablas staging se crearon correctamente.';
END $$;

-- =====================================================
-- FIN DE MIGRATION 002
-- =====================================================
