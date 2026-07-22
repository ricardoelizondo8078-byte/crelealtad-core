-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 2.2: MIGRAR TABLA EXPEDIENTES
-- ============================================================

-- Agregar columnas nuevas
ALTER TABLE expedientes
  ADD COLUMN IF NOT EXISTS folio           VARCHAR(20)  UNIQUE,
  ADD COLUMN IF NOT EXISTS producto_id     UUID         REFERENCES productos_credito(id),
  ADD COLUMN IF NOT EXISTS asesora_id      UUID         REFERENCES asesoras(id),
  ADD COLUMN IF NOT EXISTS horario_visita  VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dias_visita     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS semana_cobro    DATE,
  ADD COLUMN IF NOT EXISTS observaciones   TEXT;

-- Renombrar columnas al nuevo estándar
ALTER TABLE expedientes RENAME COLUMN "groupId"    TO grupo_id;
ALTER TABLE expedientes RENAME COLUMN "createdAt"  TO created_at;
ALTER TABLE expedientes RENAME COLUMN "updatedAt"  TO updated_at;

-- Estandarizar estado
ALTER TABLE expedientes RENAME COLUMN "status" TO estado;
UPDATE expedientes SET estado = 'EN_DOCUMENTACION' WHERE estado = 'En proceso';

-- Eliminar columna obsoleta
ALTER TABLE expedientes DROP COLUMN IF EXISTS title;

-- Agregar FK a grupos (si no existe ya como constraint formal)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_expedientes_grupo'
  ) THEN
    ALTER TABLE expedientes
      ADD CONSTRAINT fk_expedientes_grupo
      FOREIGN KEY (grupo_id) REFERENCES grupos(id);
  END IF;
END $$;
