BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_llamadas
    WHERE tipo_telefono IS NOT NULL OR telefono IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen intentos con el teléfono utilizado y deben conservarse como historial';
  END IF;
END
$$;

DROP INDEX IF EXISTS ix_verificacion_llamadas_integrante_tipo_telefono_fecha;

ALTER TABLE verificacion_llamadas
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_telefono_par_check,
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_telefono_check,
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_tipo_telefono_check,
  DROP COLUMN IF EXISTS telefono,
  DROP COLUMN IF EXISTS tipo_telefono;

COMMIT;
