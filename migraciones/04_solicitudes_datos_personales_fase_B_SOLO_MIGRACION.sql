-- =====================================================
-- MIGRACIÓN 2B: solicitudes_datos_personales - Columna GENERATED "nombre_completo"
-- =====================================================

BEGIN;

-- Agregar columna generada usando operador || que es IMMUTABLE
ALTER TABLE solicitudes_datos_personales
ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(255)
GENERATED ALWAYS AS (
  CASE
    WHEN nombres IS NOT NULL THEN
      BTRIM(
        nombres || ' ' || COALESCE(apellido_pat, '') ||
        COALESCE(' ' || NULLIF(apellido_mat, ''), '')
      )
    ELSE NULL
  END
) STORED;

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_solicitudes_datos_personales_nombre_completo
ON solicitudes_datos_personales USING gin (to_tsvector('spanish', nombre_completo))
WHERE nombre_completo IS NOT NULL;

COMMIT;
