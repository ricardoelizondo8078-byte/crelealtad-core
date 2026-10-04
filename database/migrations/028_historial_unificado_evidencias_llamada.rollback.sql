BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_llamada_evidencias
    WHERE proposito = 'CONFIRMACION_TELEFONO' OR version > 1
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen evidencias telefónicas o versiones posteriores que deben conservarse';
  END IF;
END
$$;

ALTER TABLE verificacion_entrevista_telefono_confirmaciones
  DROP CONSTRAINT IF EXISTS verificacion_entrevista_telefono_evidencia_fkey,
  DROP COLUMN IF EXISTS evidencia_id;

DROP INDEX IF EXISTS ix_verificacion_llamada_evidencias_llamada_fecha;
DROP INDEX IF EXISTS ux_verificacion_llamada_evidencias_version;

ALTER TABLE verificacion_llamada_evidencias
  DROP CONSTRAINT IF EXISTS verificacion_llamada_evidencias_contexto_check,
  DROP CONSTRAINT IF EXISTS verificacion_llamada_evidencias_telefono_check,
  DROP CONSTRAINT IF EXISTS verificacion_llamada_evidencias_tipo_check,
  DROP CONSTRAINT IF EXISTS verificacion_llamada_evidencias_version_check,
  DROP CONSTRAINT IF EXISTS verificacion_llamada_evidencias_proposito_check,
  DROP CONSTRAINT IF EXISTS verificacion_llamada_evidencias_llamada_fkey,
  ALTER COLUMN encuesta_id SET NOT NULL,
  DROP COLUMN IF EXISTS telefono,
  DROP COLUMN IF EXISTS tipo_telefono,
  DROP COLUMN IF EXISTS version,
  DROP COLUMN IF EXISTS proposito,
  DROP COLUMN IF EXISTS llamada_id;

COMMIT;
