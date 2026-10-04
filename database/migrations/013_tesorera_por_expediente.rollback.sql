BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM expedientes
    WHERE tesorera_integrante_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen asignaciones de tesorera que deben conservarse como historial';
  END IF;
END
$$;

DROP INDEX IF EXISTS ix_expedientes_tesorera_integrante;

ALTER TABLE expedientes
  DROP CONSTRAINT IF EXISTS expedientes_tesorera_integrante_fkey,
  DROP COLUMN IF EXISTS tesorera_integrante_id;

ALTER TABLE integrantes
  DROP CONSTRAINT IF EXISTS integrantes_expediente_id_id_key;

COMMIT;
