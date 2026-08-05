-- =====================================================
-- MIGRACIÓN 2A: solicitudes_datos_personales - Agregar "nombres" y migrar datos
-- =====================================================

BEGIN;

-- Paso 1: Agregar la nueva columna "nombres" (nullable por ahora)
ALTER TABLE solicitudes_datos_personales
ADD COLUMN IF NOT EXISTS nombres VARCHAR(150);

-- Paso 2: Migrar datos existentes
UPDATE solicitudes_datos_personales
SET nombres = TRIM(
  CONCAT_WS(' ',
    NULLIF(TRIM(primer_nombre), ''),
    NULLIF(TRIM(segundo_nombre), '')
  )
)
WHERE nombres IS NULL;

-- Paso 3: Verificar que NO hay registros con nombres NULL
-- (puede haber registros sin nombres si el snapshot está incompleto)
DO $$
DECLARE
  null_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM solicitudes_datos_personales;
  SELECT COUNT(*) INTO null_count
  FROM solicitudes_datos_personales
  WHERE nombres IS NULL AND (primer_nombre IS NOT NULL OR segundo_nombre IS NOT NULL);

  IF null_count > 0 THEN
    RAISE EXCEPTION 'ERROR: % registros tienen nombres NULL pero tenían primer/segundo nombre', null_count;
  END IF;

  RAISE NOTICE 'OK: Migración completada correctamente (% registros totales)', total_count;
END $$;

COMMIT;

-- =====================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- =====================================================

SELECT
  COUNT(*) as total_registros,
  COUNT(CASE WHEN nombres IS NOT NULL THEN 1 END) as con_nombres,
  COUNT(CASE WHEN primer_nombre IS NOT NULL THEN 1 END) as con_primer_nombre,
  COUNT(CASE WHEN segundo_nombre IS NOT NULL THEN 1 END) as con_segundo_nombre
FROM solicitudes_datos_personales;

-- Muestra ejemplos de la migración
SELECT
  solicitud_id,
  primer_nombre,
  segundo_nombre,
  nombres,
  apellido_pat,
  apellido_mat
FROM solicitudes_datos_personales
WHERE nombres IS NOT NULL
LIMIT 10;
