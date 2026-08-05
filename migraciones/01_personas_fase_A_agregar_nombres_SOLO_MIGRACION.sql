-- =====================================================
-- MIGRACIÓN 1A: personas - Agregar "nombres" y migrar datos
-- =====================================================

BEGIN;

-- Paso 1: Agregar la nueva columna "nombres" (nullable temporalmente)
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS nombres VARCHAR(150);

-- Paso 2: Migrar datos - CONCATENACIÓN SEGURA
-- CONCAT_WS omite automáticamente valores NULL y no deja espacios sobrantes
UPDATE personas
SET nombres = TRIM(
  CONCAT_WS(' ',
    NULLIF(TRIM(primer_nombre), ''),
    NULLIF(TRIM(segundo_nombre), '')
  )
)
WHERE nombres IS NULL;

-- Paso 3: Verificar que NO hay registros con nombres NULL o vacíos
DO $$
DECLARE
  null_count INTEGER;
  empty_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM personas
  WHERE nombres IS NULL;

  SELECT COUNT(*) INTO empty_count
  FROM personas
  WHERE TRIM(nombres) = '';

  IF null_count > 0 THEN
    RAISE EXCEPTION 'ERROR: % registros tienen nombres NULL después de la migración', null_count;
  END IF;

  IF empty_count > 0 THEN
    RAISE EXCEPTION 'ERROR: % registros tienen nombres vacíos después de la migración', empty_count;
  END IF;

  RAISE NOTICE 'OK: Todos los registros tienen nombres migrados correctamente';
END $$;

-- Paso 4: Hacer la columna NOT NULL
ALTER TABLE personas
ALTER COLUMN nombres SET NOT NULL;

COMMIT;
