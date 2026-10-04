BEGIN;

ALTER TYPE solicitantes_estado_enum
  ADD VALUE IF NOT EXISTS 'RETIRADA';

ALTER TABLE integrantes
  ADD COLUMN IF NOT EXISTS motivo_retiro VARCHAR(40),
  ADD COLUMN IF NOT EXISTS motivo_retiro_detalle VARCHAR(250),
  ADD COLUMN IF NOT EXISTS retirada_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retirada_por UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'integrantes_motivo_retiro_check'
      AND conrelid = 'integrantes'::regclass
  ) THEN
    ALTER TABLE integrantes
      ADD CONSTRAINT integrantes_motivo_retiro_check
      CHECK (
        motivo_retiro IS NULL
        OR motivo_retiro IN (
          'DESCANSA_RENOVACION',
          'DOCUMENTACION_INCOMPLETA',
          'DECIDIO_NO_CONTINUAR',
          'OTRO'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'integrantes_retiro_contexto_check'
      AND conrelid = 'integrantes'::regclass
  ) THEN
    ALTER TABLE integrantes
      ADD CONSTRAINT integrantes_retiro_contexto_check
      CHECK (
        (
          estado::TEXT = 'RETIRADA'
          AND motivo_retiro IS NOT NULL
          AND retirada_at IS NOT NULL
          AND retirada_por IS NOT NULL
          AND (
            (motivo_retiro = 'OTRO' AND NULLIF(BTRIM(motivo_retiro_detalle), '') IS NOT NULL)
            OR (motivo_retiro <> 'OTRO' AND motivo_retiro_detalle IS NULL)
          )
        )
        OR (
          estado::TEXT <> 'RETIRADA'
          AND motivo_retiro IS NULL
          AND motivo_retiro_detalle IS NULL
          AND retirada_at IS NULL
          AND retirada_por IS NULL
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'integrantes_retirada_por_fkey'
      AND conrelid = 'integrantes'::regclass
  ) THEN
    ALTER TABLE integrantes
      ADD CONSTRAINT integrantes_retirada_por_fkey
      FOREIGN KEY (retirada_por)
      REFERENCES usuarios(id)
      ON DELETE RESTRICT;
  END IF;
END
$$;

COMMENT ON COLUMN integrantes.motivo_retiro IS
  'Motivo controlado por el que la persona no participa en este expediente.';
COMMENT ON COLUMN integrantes.motivo_retiro_detalle IS
  'Detalle obligatorio únicamente cuando motivo_retiro es OTRO.';
COMMENT ON COLUMN integrantes.retirada_at IS
  'Fecha del retiro formal de la participación en este expediente.';
COMMENT ON COLUMN integrantes.retirada_por IS
  'Usuario que confirmó el retiro; referencia auditada con borrado restringido.';

COMMIT;

