BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_entrevista_evidencia_integrantes
    WHERE activo = FALSE
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen asociaciones desactivadas cuyo historial se perderia';
  END IF;
END
$$;

ALTER TABLE verificacion_entrevista_evidencia_integrantes
  DROP CONSTRAINT verificacion_entrevista_evidencia_integrantes_actualizada_por_fkey,
  DROP COLUMN updated_at,
  DROP COLUMN actualizada_por,
  DROP COLUMN activo;

COMMIT;
