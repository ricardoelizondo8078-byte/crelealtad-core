BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_entrevista_evidencias
    WHERE motivo_clasificacion_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen evidencias con motivo de clasificacion que se perderia';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM motivos_clasificacion_evidencia
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen motivos de clasificacion que se perderian';
  END IF;
END
$$;

DROP INDEX ix_verificacion_entrevista_evidencias_motivo_clasificacion;

ALTER TABLE verificacion_entrevista_evidencias
  DROP CONSTRAINT verificacion_entrevista_evidencias_nuevas_con_motivo_check,
  DROP CONSTRAINT verificacion_entrevista_evidencias_motivo_tipo_check,
  DROP CONSTRAINT verificacion_entrevista_evidencias_motivo_color_fkey,
  DROP COLUMN motivo_clasificacion_id;

DROP TABLE motivos_clasificacion_evidencia;

COMMIT;
