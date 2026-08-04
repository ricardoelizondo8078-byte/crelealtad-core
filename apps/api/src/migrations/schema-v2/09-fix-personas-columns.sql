-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 9: CORREGIR COLUMNAS FALTANTES EN PERSONAS
-- ============================================================

-- Agregar columnas que existen en la entidad TypeORM pero no en el schema base
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
  ADD COLUMN IF NOT EXISTS monto_solicitado DECIMAL(10,2);

-- Crear índice para búsquedas por teléfono (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_personas_telefono ON personas(telefono)
WHERE telefono IS NOT NULL;

-- Verificación
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'personas'
  AND column_name IN ('telefono', 'monto_solicitado');
