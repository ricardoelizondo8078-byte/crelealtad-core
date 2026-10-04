BEGIN;

ALTER TABLE verificacion_llamada_evidencias
  ADD COLUMN IF NOT EXISTS llamada_id UUID,
  ADD COLUMN IF NOT EXISTS proposito VARCHAR(30),
  ADD COLUMN IF NOT EXISTS version INTEGER,
  ADD COLUMN IF NOT EXISTS tipo_telefono VARCHAR(20),
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(10);

UPDATE verificacion_llamada_evidencias evidencia
SET llamada_id = encuesta.llamada_id,
    proposito = 'ENCUESTA',
    version = 1
FROM verificacion_llamada_encuestas encuesta
WHERE encuesta.id = evidencia.encuesta_id
  AND (evidencia.llamada_id IS NULL OR evidencia.proposito IS NULL OR evidencia.version IS NULL);

ALTER TABLE verificacion_llamada_evidencias
  ALTER COLUMN encuesta_id DROP NOT NULL;

INSERT INTO verificacion_llamada_evidencias (
  id,
  encuesta_id,
  llamada_id,
  proposito,
  version,
  tipo_telefono,
  telefono,
  ruta,
  mime_type,
  tamano_bytes,
  sha256,
  registrada_por,
  created_at
)
SELECT
  confirmacion.id,
  NULL,
  confirmacion.llamada_id,
  'CONFIRMACION_TELEFONO',
  1,
  confirmacion.tipo_telefono,
  confirmacion.telefono,
  confirmacion.ruta,
  confirmacion.mime_type,
  confirmacion.tamano_bytes,
  confirmacion.sha256,
  confirmacion.registrada_por,
  confirmacion.created_at
FROM verificacion_entrevista_telefono_confirmaciones confirmacion
ON CONFLICT (id) DO NOTHING;

ALTER TABLE verificacion_llamada_evidencias
  ALTER COLUMN llamada_id SET NOT NULL,
  ALTER COLUMN proposito SET NOT NULL,
  ALTER COLUMN version SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verificacion_llamada_evidencias_llamada_fkey'
      AND conrelid = 'public.verificacion_llamada_evidencias'::regclass
  ) THEN
    ALTER TABLE verificacion_llamada_evidencias
      ADD CONSTRAINT verificacion_llamada_evidencias_llamada_fkey
      FOREIGN KEY (llamada_id) REFERENCES verificacion_llamadas(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verificacion_llamada_evidencias_proposito_check'
      AND conrelid = 'public.verificacion_llamada_evidencias'::regclass
  ) THEN
    ALTER TABLE verificacion_llamada_evidencias
      ADD CONSTRAINT verificacion_llamada_evidencias_proposito_check
      CHECK (proposito IN ('ENCUESTA', 'CONFIRMACION_TELEFONO'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verificacion_llamada_evidencias_version_check'
      AND conrelid = 'public.verificacion_llamada_evidencias'::regclass
  ) THEN
    ALTER TABLE verificacion_llamada_evidencias
      ADD CONSTRAINT verificacion_llamada_evidencias_version_check
      CHECK (version > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verificacion_llamada_evidencias_tipo_check'
      AND conrelid = 'public.verificacion_llamada_evidencias'::regclass
  ) THEN
    ALTER TABLE verificacion_llamada_evidencias
      ADD CONSTRAINT verificacion_llamada_evidencias_tipo_check
      CHECK (tipo_telefono IS NULL OR tipo_telefono IN ('PRINCIPAL', 'SECUNDARIO'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verificacion_llamada_evidencias_telefono_check'
      AND conrelid = 'public.verificacion_llamada_evidencias'::regclass
  ) THEN
    ALTER TABLE verificacion_llamada_evidencias
      ADD CONSTRAINT verificacion_llamada_evidencias_telefono_check
      CHECK (telefono IS NULL OR telefono ~ '^[0-9]{10}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verificacion_llamada_evidencias_contexto_check'
      AND conrelid = 'public.verificacion_llamada_evidencias'::regclass
  ) THEN
    ALTER TABLE verificacion_llamada_evidencias
      ADD CONSTRAINT verificacion_llamada_evidencias_contexto_check
      CHECK (
        (proposito = 'ENCUESTA' AND encuesta_id IS NOT NULL
          AND tipo_telefono IS NULL AND telefono IS NULL)
        OR
        (proposito = 'CONFIRMACION_TELEFONO' AND encuesta_id IS NULL
          AND tipo_telefono IS NOT NULL AND telefono IS NOT NULL)
      );
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_verificacion_llamada_evidencias_version
  ON verificacion_llamada_evidencias(llamada_id, proposito, version);

CREATE INDEX IF NOT EXISTS ix_verificacion_llamada_evidencias_llamada_fecha
  ON verificacion_llamada_evidencias(llamada_id, created_at DESC);

COMMENT ON TABLE verificacion_llamada_evidencias IS
  'Historial unificado y versionado de imágenes de Llamada, incluidas encuesta y confirmación telefónica desde Entrevista.';

ALTER TABLE verificacion_entrevista_telefono_confirmaciones
  ADD COLUMN IF NOT EXISTS evidencia_id UUID;

UPDATE verificacion_entrevista_telefono_confirmaciones
SET evidencia_id = id
WHERE evidencia_id IS NULL;

ALTER TABLE verificacion_entrevista_telefono_confirmaciones
  ALTER COLUMN evidencia_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'verificacion_entrevista_telefono_evidencia_fkey'
      AND conrelid = 'public.verificacion_entrevista_telefono_confirmaciones'::regclass
  ) THEN
    ALTER TABLE verificacion_entrevista_telefono_confirmaciones
      ADD CONSTRAINT verificacion_entrevista_telefono_evidencia_fkey
      FOREIGN KEY (evidencia_id) REFERENCES verificacion_llamada_evidencias(id) ON DELETE RESTRICT;
  END IF;
END
$$;

COMMIT;
