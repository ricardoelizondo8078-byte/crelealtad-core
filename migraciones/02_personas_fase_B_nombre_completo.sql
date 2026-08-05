-- =====================================================
-- MIGRACIÓN 1B: personas - Columna GENERATED "nombre_completo"
-- =====================================================

BEGIN;

-- Columna generada con CONCAT_WS para manejar NULL sin espacios sobrantes
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(255)
GENERATED ALWAYS AS (
  TRIM(
    CONCAT_WS(' ',
      NULLIF(TRIM(nombres), ''),
      NULLIF(TRIM(apellido_pat), ''),
      NULLIF(TRIM(apellido_mat), '')
    )
  )
) STORED;

-- Índice GIN para búsqueda full-text en español
CREATE INDEX IF NOT EXISTS idx_personas_nombre_completo
ON personas USING gin (to_tsvector('spanish', nombre_completo));

-- Índice B-tree para ordenamiento
CREATE INDEX IF NOT EXISTS idx_personas_nombre_completo_btree
ON personas (nombre_completo);

COMMIT;

-- =====================================================
-- VERIFICACIÓN DE COLUMNA GENERADA
-- =====================================================

-- Ver casos con apellido_mat NULL
SELECT
  'Con apellido materno' as caso,
  nombres,
  apellido_pat,
  apellido_mat,
  nombre_completo,
  LENGTH(nombre_completo) as longitud,
  -- Verificar que no hay espacios dobles
  CASE
    WHEN nombre_completo LIKE '%  %' THEN 'ERROR: espacios dobles'
    ELSE 'OK'
  END as check_espacios
FROM personas
WHERE apellido_mat IS NOT NULL AND TRIM(apellido_mat) != ''
LIMIT 3

UNION ALL

SELECT
  'Sin apellido materno',
  nombres,
  apellido_pat,
  apellido_mat,
  nombre_completo,
  LENGTH(nombre_completo),
  CASE
    WHEN nombre_completo LIKE '%  %' THEN 'ERROR: espacios dobles'
    WHEN nombre_completo LIKE '% ' THEN 'ERROR: espacio al final'
    ELSE 'OK'
  END
FROM personas
WHERE apellido_mat IS NULL OR TRIM(apellido_mat) = ''
LIMIT 3;

-- Detectar cualquier anomalía
SELECT
  'Anomalías detectadas' as alerta,
  COUNT(*) as cantidad
FROM personas
WHERE
  nombre_completo LIKE '%  %'  -- espacios dobles
  OR nombre_completo LIKE ' %'  -- espacio al inicio
  OR nombre_completo LIKE '% '  -- espacio al final
  OR nombre_completo LIKE '%NULL%';  -- palabra NULL
