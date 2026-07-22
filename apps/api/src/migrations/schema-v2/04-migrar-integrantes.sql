-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 2.3: RENOMBRAR Y MIGRAR SOLICITANTES → INTEGRANTES
-- ============================================================

-- Renombrar la tabla
ALTER TABLE solicitantes RENAME TO integrantes;

-- Agregar columnas nuevas
ALTER TABLE integrantes
  ADD COLUMN IF NOT EXISTS folio      VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS persona_id UUID        REFERENCES personas(id);

-- Renombrar columnas al nuevo estándar
ALTER TABLE integrantes RENAME COLUMN "expedienteId"  TO expediente_id;
ALTER TABLE integrantes RENAME COLUMN "createdAt"     TO created_at;
ALTER TABLE integrantes RENAME COLUMN "updatedAt"     TO updated_at;

-- Estandarizar estado
ALTER TABLE integrantes RENAME COLUMN "estado" TO estado;
UPDATE integrantes SET estado = 'DOCUMENTANDO' WHERE estado = 'DOCUMENTANDO';

-- Eliminar columnas que ya no aplican
ALTER TABLE integrantes
  DROP COLUMN IF EXISTS nombre,
  DROP COLUMN IF EXISTS nombres,
  DROP COLUMN IF EXISTS "apellidoPaterno",
  DROP COLUMN IF EXISTS "apellidoMaterno",
  DROP COLUMN IF EXISTS telefono,
  DROP COLUMN IF EXISTS "telefonoSecundario",
  DROP COLUMN IF EXISTS "montoSolicitado",
  DROP COLUMN IF EXISTS "seccionActual";

-- Agregar constraint única: una persona no puede aparecer
-- dos veces en el mismo expediente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'uq_integrante_expediente_persona'
  ) THEN
    ALTER TABLE integrantes
      ADD CONSTRAINT uq_integrante_expediente_persona
      UNIQUE (expediente_id, persona_id);
  END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_integrantes_persona    ON integrantes(persona_id);
CREATE INDEX IF NOT EXISTS idx_integrantes_expediente ON integrantes(expediente_id);
