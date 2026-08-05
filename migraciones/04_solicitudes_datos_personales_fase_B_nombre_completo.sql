-- =====================================================
-- MIGRACIÓN 2B: solicitudes_datos_personales - Columna GENERATED "nombre_completo"
-- =====================================================

BEGIN;

-- Agregar columna generada que concatena nombres + apellidos
ALTER TABLE solicitudes_datos_personales
ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(255)
GENERATED ALWAYS AS (
  CASE
    WHEN nombres IS NOT NULL THEN
      TRIM(
        CONCAT_WS(' ',
          NULLIF(TRIM(nombres), ''),
          NULLIF(TRIM(apellido_pat), ''),
          NULLIF(TRIM(apellido_mat), '')
        )
      )
    ELSE NULL
  END
) STORED;

-- Crear índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_solicitudes_datos_personales_nombre_completo
ON solicitudes_datos_personales USING gin (to_tsvector('spanish', nombre_completo))
WHERE nombre_completo IS NOT NULL;

COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT
  nombres,
  apellido_pat,
  apellido_mat,
  nombre_completo,
  LENGTH(nombre_completo) as longitud,
  CASE
    WHEN nombre_completo LIKE '%  %' THEN 'ERROR: espacios dobles'
    WHEN nombre_completo LIKE '% ' THEN 'ERROR: espacio al final'
    ELSE 'OK'
  END as check_espacios
FROM solicitudes_datos_personales
WHERE nombres IS NOT NULL
LIMIT 10;
