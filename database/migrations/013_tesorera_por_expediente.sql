BEGIN;

ALTER TABLE expedientes
  ADD COLUMN IF NOT EXISTS tesorera_integrante_id UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'integrantes_expediente_id_id_key'
      AND conrelid = 'integrantes'::regclass
  ) THEN
    ALTER TABLE integrantes
      ADD CONSTRAINT integrantes_expediente_id_id_key
      UNIQUE (expediente_id, id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'expedientes_tesorera_integrante_fkey'
      AND conrelid = 'expedientes'::regclass
  ) THEN
    ALTER TABLE expedientes
      ADD CONSTRAINT expedientes_tesorera_integrante_fkey
      FOREIGN KEY (id, tesorera_integrante_id)
      REFERENCES integrantes(expediente_id, id)
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ix_expedientes_tesorera_integrante
  ON expedientes(tesorera_integrante_id)
  WHERE tesorera_integrante_id IS NOT NULL;

COMMENT ON COLUMN expedientes.tesorera_integrante_id IS
  'Integrante del mismo expediente seleccionada como tesorera para Documentacion y Verificacion; la tesorera definitiva del ciclo se confirma en Desembolso.';

COMMIT;
