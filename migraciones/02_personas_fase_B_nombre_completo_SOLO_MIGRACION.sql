-- =====================================================
-- MIGRACIÓN 1B: personas - Columna GENERATED "nombre_completo"
-- =====================================================

BEGIN;

-- Columna generada usando operador || que es IMMUTABLE
ALTER TABLE personas
ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(255)
GENERATED ALWAYS AS (
  BTRIM(
    nombres || ' ' || apellido_pat ||
    COALESCE(' ' || NULLIF(apellido_mat, ''), '')
  )
) STORED;

-- Índice GIN para búsqueda full-text en español
CREATE INDEX IF NOT EXISTS idx_personas_nombre_completo
ON personas USING gin (to_tsvector('spanish', nombre_completo));

-- Índice B-tree para ordenamiento
CREATE INDEX IF NOT EXISTS idx_personas_nombre_completo_btree
ON personas (nombre_completo);

COMMIT;
