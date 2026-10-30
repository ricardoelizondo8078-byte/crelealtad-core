BEGIN;

CREATE TABLE public.financieras_competidoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_oficial VARCHAR(120) NOT NULL,
  nombre_normalizado VARCHAR(120) NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_financieras_competidoras_nombre_normalizado
    UNIQUE (nombre_normalizado),
  CONSTRAINT ck_financieras_competidoras_nombre
    CHECK (BTRIM(nombre_oficial) <> '' AND BTRIM(nombre_normalizado) <> ''),
  CONSTRAINT fk_financieras_competidoras_created_by
    FOREIGN KEY (created_by)
    REFERENCES public.usuarios(id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
);

CREATE TABLE public.financieras_competidoras_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financiera_id UUID NOT NULL,
  revision INTEGER NOT NULL,
  clasificacion VARCHAR(24) NOT NULL,
  motivo VARCHAR(500) NOT NULL,
  aliases VARCHAR(120)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(120)[],
  aliases_normalizados VARCHAR(120)[] NOT NULL DEFAULT ARRAY[]::VARCHAR(120)[],
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  vigencia_desde DATE NOT NULL,
  vigencia_hasta DATE NULL,
  estado VARCHAR(24) NOT NULL DEFAULT 'PENDIENTE_APROBACION',
  propuesta_por UUID NOT NULL,
  propuesta_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  decidida_por UUID NULL,
  decidida_at TIMESTAMPTZ NULL,
  motivo_rechazo VARCHAR(500) NULL,
  publicada_por UUID NULL,
  publicada_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_financieras_competidoras_version
    UNIQUE (financiera_id, revision),
  CONSTRAINT ck_financieras_competidoras_revision
    CHECK (revision > 0),
  CONSTRAINT ck_financieras_competidoras_clasificacion
    CHECK (clasificacion IN ('OBJETIVO', 'REVISION', 'NO_PRIORITARIA')),
  CONSTRAINT ck_financieras_competidoras_version_estado
    CHECK (estado IN ('PENDIENTE_APROBACION', 'APROBADA', 'RECHAZADA', 'PUBLICADA')),
  CONSTRAINT ck_financieras_competidoras_motivo
    CHECK (BTRIM(motivo) <> ''),
  CONSTRAINT ck_financieras_competidoras_vigencia
    CHECK (vigencia_hasta IS NULL OR vigencia_hasta >= vigencia_desde),
  CONSTRAINT ck_financieras_competidoras_aliases
    CHECK (cardinality(aliases) = cardinality(aliases_normalizados)),
  CONSTRAINT ck_financieras_competidoras_decision
    CHECK (
      (estado = 'PENDIENTE_APROBACION' AND decidida_por IS NULL AND decidida_at IS NULL)
      OR
      (estado IN ('APROBADA', 'RECHAZADA', 'PUBLICADA') AND decidida_por IS NOT NULL AND decidida_at IS NOT NULL)
    ),
  CONSTRAINT ck_financieras_competidoras_publicacion
    CHECK (
      (estado <> 'PUBLICADA' AND publicada_por IS NULL AND publicada_at IS NULL)
      OR
      (estado = 'PUBLICADA' AND publicada_por IS NOT NULL AND publicada_at IS NOT NULL)
    ),
  CONSTRAINT ck_financieras_competidoras_rechazo
    CHECK (
      (estado <> 'RECHAZADA' AND motivo_rechazo IS NULL)
      OR
      (estado = 'RECHAZADA' AND BTRIM(COALESCE(motivo_rechazo, '')) <> '')
    ),
  CONSTRAINT fk_financieras_competidoras_version_financiera
    FOREIGN KEY (financiera_id)
    REFERENCES public.financieras_competidoras(id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT,
  CONSTRAINT fk_financieras_competidoras_version_propuesta_por
    FOREIGN KEY (propuesta_por)
    REFERENCES public.usuarios(id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT,
  CONSTRAINT fk_financieras_competidoras_version_decidida_por
    FOREIGN KEY (decidida_por)
    REFERENCES public.usuarios(id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT,
  CONSTRAINT fk_financieras_competidoras_version_publicada_por
    FOREIGN KEY (publicada_por)
    REFERENCES public.usuarios(id)
    ON UPDATE NO ACTION
    ON DELETE RESTRICT
);

CREATE UNIQUE INDEX uq_financieras_competidoras_version_abierta
  ON public.financieras_competidoras_versiones (financiera_id)
  WHERE estado IN ('PENDIENTE_APROBACION', 'APROBADA');

CREATE INDEX idx_financieras_competidoras_version_vigencia
  ON public.financieras_competidoras_versiones
  (financiera_id, estado, vigencia_desde DESC, vigencia_hasta);

CREATE INDEX idx_financieras_competidoras_version_aliases
  ON public.financieras_competidoras_versiones
  USING GIN (aliases_normalizados);

COMMIT;
