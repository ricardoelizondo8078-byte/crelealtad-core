-- ============================================
-- MIGRACIÓN: Permitir NULL en columnas legacy
-- ============================================
-- Fecha: 2026-08-04
-- Propósito: Quitar restricción NOT NULL de primer_nombre y segundo_nombre
--            para permitir que el código nuevo funcione sin llenarlas
-- Nota: Las columnas NO se eliminan, solo se permite NULL como respaldo
-- ============================================

BEGIN;

-- ============================================
-- TABLA: personas
-- ============================================
-- Quitar NOT NULL de primer_nombre
ALTER TABLE personas
  ALTER COLUMN primer_nombre DROP NOT NULL;

-- Quitar NOT NULL de segundo_nombre
ALTER TABLE personas
  ALTER COLUMN segundo_nombre DROP NOT NULL;

COMMENT ON COLUMN personas.primer_nombre IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';
COMMENT ON COLUMN personas.segundo_nombre IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';

-- ============================================
-- TABLA: solicitudes_datos_personales
-- ============================================
-- Verificar si existe la tabla primero
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'solicitudes_datos_personales'
  ) THEN
    -- Quitar NOT NULL de primer_nombre
    ALTER TABLE solicitudes_datos_personales
      ALTER COLUMN primer_nombre DROP NOT NULL;

    -- Quitar NOT NULL de segundo_nombre
    ALTER TABLE solicitudes_datos_personales
      ALTER COLUMN segundo_nombre DROP NOT NULL;

    COMMENT ON COLUMN solicitudes_datos_personales.primer_nombre IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';
    COMMENT ON COLUMN solicitudes_datos_personales.segundo_nombre IS 'LEGACY - Ya no se usa. Usar "nombres" en su lugar.';

    RAISE NOTICE 'Restricciones NOT NULL removidas de solicitudes_datos_personales';
  ELSE
    RAISE NOTICE 'Tabla solicitudes_datos_personales no existe, omitiendo';
  END IF;
END $$;

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ver el estado actual de las columnas
SELECT
  table_name,
  column_name,
  is_nullable,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name IN ('personas', 'solicitudes_datos_personales')
  AND column_name IN ('primer_nombre', 'segundo_nombre', 'nombres', 'nombre_completo')
ORDER BY table_name,
  CASE
    WHEN column_name = 'nombres' THEN 1
    WHEN column_name = 'primer_nombre' THEN 2
    WHEN column_name = 'segundo_nombre' THEN 3
    WHEN column_name = 'nombre_completo' THEN 4
  END;

COMMIT;

-- ============================================
-- RESULTADO ESPERADO:
-- ============================================
-- personas.nombres:           NOT NULL (columna nueva, requerida)
-- personas.primer_nombre:     NULL (legacy, opcional)
-- personas.segundo_nombre:    NULL (legacy, opcional)
-- personas.nombre_completo:   NULL (generada automáticamente)
-- ============================================
