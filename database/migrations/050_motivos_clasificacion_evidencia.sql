BEGIN;

CREATE TABLE motivos_clasificacion_evidencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clasificacion VARCHAR(10) NOT NULL,
  concepto VARCHAR(120) NOT NULL,
  concepto_normalizado VARCHAR(120) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT motivos_clasificacion_evidencia_clasificacion_check
    CHECK (clasificacion IN ('VERDE', 'AMARILLO', 'ROJO')),
  CONSTRAINT motivos_clasificacion_evidencia_concepto_check
    CHECK (char_length(btrim(concepto)) BETWEEN 2 AND 120),
  CONSTRAINT motivos_clasificacion_evidencia_concepto_normalizado_check
    CHECK (char_length(btrim(concepto_normalizado)) BETWEEN 2 AND 120),
  CONSTRAINT motivos_clasificacion_evidencia_color_concepto_unique
    UNIQUE (clasificacion, concepto_normalizado),
  CONSTRAINT motivos_clasificacion_evidencia_id_color_unique
    UNIQUE (id, clasificacion),
  CONSTRAINT motivos_clasificacion_evidencia_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE RESTRICT,
  CONSTRAINT motivos_clasificacion_evidencia_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES usuarios(id) ON DELETE RESTRICT
);

CREATE INDEX ix_motivos_clasificacion_evidencia_color_activo
  ON motivos_clasificacion_evidencia (clasificacion, activo, concepto_normalizado);

ALTER TABLE verificacion_entrevista_evidencias
  ADD COLUMN motivo_clasificacion_id UUID;

ALTER TABLE verificacion_entrevista_evidencias
  ADD CONSTRAINT verificacion_entrevista_evidencias_motivo_color_fkey
  FOREIGN KEY (motivo_clasificacion_id, clasificacion_semaforo)
  REFERENCES motivos_clasificacion_evidencia (id, clasificacion)
  ON DELETE RESTRICT;

ALTER TABLE verificacion_entrevista_evidencias
  ADD CONSTRAINT verificacion_entrevista_evidencias_motivo_tipo_check
    CHECK (
      motivo_clasificacion_id IS NULL
      OR tipo IN ('HISTORIAL_CREDITO_ACTIVO', 'HISTORIAL_CREDITO_INACTIVO')
    ),
  ADD CONSTRAINT verificacion_entrevista_evidencias_nuevas_con_motivo_check
    CHECK (
      tipo NOT IN ('HISTORIAL_CREDITO_ACTIVO', 'HISTORIAL_CREDITO_INACTIVO')
      OR (
        clasificacion_semaforo IS NOT NULL
        AND motivo_clasificacion_id IS NOT NULL
      )
    ) NOT VALID;

CREATE INDEX ix_verificacion_entrevista_evidencias_motivo_clasificacion
  ON verificacion_entrevista_evidencias (motivo_clasificacion_id)
  WHERE motivo_clasificacion_id IS NOT NULL;

COMMENT ON TABLE motivos_clasificacion_evidencia IS
  'Catalogo administrable de un solo motivo obligatorio por color para nuevas evidencias de otra financiera.';

COMMENT ON COLUMN verificacion_entrevista_evidencias.motivo_clasificacion_id IS
  'Motivo institucional elegido para la clasificacion. NULL conserva evidencias anteriores a la parametrizacion.';

COMMIT;
