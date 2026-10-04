BEGIN;

ALTER TABLE verificacion_llamadas
  ADD COLUMN IF NOT EXISTS tipo_telefono VARCHAR(20),
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(10);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verificacion_llamadas_tipo_telefono_check'
      AND conrelid = 'public.verificacion_llamadas'::regclass
  ) THEN
    ALTER TABLE verificacion_llamadas
      ADD CONSTRAINT verificacion_llamadas_tipo_telefono_check
      CHECK (tipo_telefono IS NULL OR tipo_telefono IN ('PRINCIPAL', 'SECUNDARIO'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verificacion_llamadas_telefono_check'
      AND conrelid = 'public.verificacion_llamadas'::regclass
  ) THEN
    ALTER TABLE verificacion_llamadas
      ADD CONSTRAINT verificacion_llamadas_telefono_check
      CHECK (telefono IS NULL OR telefono ~ '^[0-9]{10}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'verificacion_llamadas_telefono_par_check'
      AND conrelid = 'public.verificacion_llamadas'::regclass
  ) THEN
    ALTER TABLE verificacion_llamadas
      ADD CONSTRAINT verificacion_llamadas_telefono_par_check
      CHECK ((tipo_telefono IS NULL) = (telefono IS NULL));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS ix_verificacion_llamadas_integrante_tipo_telefono_fecha
  ON verificacion_llamadas(integrante_id, tipo_telefono, created_at DESC)
  WHERE telefono IS NOT NULL;

COMMENT ON COLUMN verificacion_llamadas.tipo_telefono IS
  'Tipo del número utilizado: PRINCIPAL o SECUNDARIO. NULL sólo para intentos históricos sin este dato.';
COMMENT ON COLUMN verificacion_llamadas.telefono IS
  'Número normalizado de diez dígitos utilizado en el intento. NULL sólo para intentos históricos sin este dato.';

COMMIT;
