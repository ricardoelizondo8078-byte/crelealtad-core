-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 11: CORREGIR NOMBRES DE COLUMNAS EN SOLICITUDES
-- Eliminar camelCase y sufijos _nuevo
-- ============================================================

\echo 'FASE 1: Renombrar columnas en camelCase a snake_case'
\echo '-----------------------------------------------------'

-- Renombrar columnas que están en camelCase
ALTER TABLE solicitudes RENAME COLUMN "fechaNacimiento" TO fecha_nac;
ALTER TABLE solicitudes RENAME COLUMN "estadoCivil" TO estado_civil;
ALTER TABLE solicitudes RENAME COLUMN "nivelEstudio" TO nivel_estudio;

\echo '✅ Fase 1 completada'
\echo ''

\echo 'FASE 2: Eliminar sufijos _nuevo de las columnas'
\echo '-----------------------------------------------------'

-- Verificar si existen columnas antiguas (sin _nuevo)
DO $$
DECLARE
  tiene_antigua BOOLEAN;
BEGIN
  -- Verificar estado_nacimiento
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solicitudes' AND column_name = 'estado_nacimiento'
  ) INTO tiene_antigua;

  IF NOT tiene_antigua THEN
    ALTER TABLE solicitudes RENAME COLUMN estado_nacimiento_nuevo TO estado_nacimiento;
    RAISE NOTICE '✅ Renombrado: estado_nacimiento_nuevo → estado_nacimiento';
  ELSE
    RAISE NOTICE '⚠️  Ya existe columna estado_nacimiento, eliminando estado_nacimiento_nuevo';
    ALTER TABLE solicitudes DROP COLUMN IF EXISTS estado_nacimiento_nuevo;
  END IF;

  -- Verificar negocio_giro
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solicitudes' AND column_name = 'negocio_giro'
  ) INTO tiene_antigua;

  IF NOT tiene_antigua THEN
    ALTER TABLE solicitudes RENAME COLUMN negocio_giro_nuevo TO negocio_giro;
    RAISE NOTICE '✅ Renombrado: negocio_giro_nuevo → negocio_giro';
  ELSE
    RAISE NOTICE '⚠️  Ya existe columna negocio_giro, eliminando negocio_giro_nuevo';
    ALTER TABLE solicitudes DROP COLUMN IF EXISTS negocio_giro_nuevo;
  END IF;

  -- Verificar negocio_gastos
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'solicitudes' AND column_name = 'negocio_gastos'
  ) INTO tiene_antigua;

  IF NOT tiene_antigua THEN
    ALTER TABLE solicitudes RENAME COLUMN negocio_gastos_nuevo TO negocio_gastos;
    RAISE NOTICE '✅ Renombrado: negocio_gastos_nuevo → negocio_gastos';
  ELSE
    RAISE NOTICE '⚠️  Ya existe columna negocio_gastos, eliminando negocio_gastos_nuevo';
    ALTER TABLE solicitudes DROP COLUMN IF EXISTS negocio_gastos_nuevo;
  END IF;
END $$;

\echo ''
\echo '✅ Fase 2 completada'
\echo ''

\echo 'VERIFICACIÓN FINAL: Columnas de solicitudes'
\echo '-----------------------------------------------------'
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'solicitudes'
  AND column_name IN (
    'fecha_nac',
    'estado_civil',
    'nivel_estudio',
    'estado_nacimiento',
    'negocio_giro',
    'negocio_gastos'
  )
ORDER BY column_name;

\echo ''
\echo '✅ Migración de solicitudes completada'
