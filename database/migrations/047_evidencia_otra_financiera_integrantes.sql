BEGIN;

ALTER TABLE verificacion_entrevista_evidencias
  ADD COLUMN expediente_id UUID;

UPDATE verificacion_entrevista_evidencias evidencia
SET expediente_id = integrante.expediente_id
FROM integrantes integrante
WHERE integrante.id = evidencia.integrante_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_entrevista_evidencias
    WHERE expediente_id IS NULL
  ) THEN
    RAISE EXCEPTION 'No se puede asociar evidencia: existe una fila sin expediente derivable';
  END IF;
END
$$;

ALTER TABLE verificacion_entrevista_evidencias
  ALTER COLUMN expediente_id SET NOT NULL,
  ADD CONSTRAINT verificacion_entrevista_evidencias_id_expediente_key
    UNIQUE (id, expediente_id),
  ADD CONSTRAINT verificacion_entrevista_evidencias_expediente_integrante_fkey
    FOREIGN KEY (expediente_id, integrante_id)
    REFERENCES integrantes(expediente_id, id)
    ON DELETE RESTRICT;

CREATE TABLE verificacion_entrevista_evidencia_integrantes (
  evidencia_id UUID NOT NULL,
  expediente_id UUID NOT NULL,
  integrante_id UUID NOT NULL,
  asociada_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_entrevista_evidencia_integrantes_pkey
    PRIMARY KEY (evidencia_id, integrante_id),
  CONSTRAINT verificacion_entrevista_evidencia_integrantes_evidencia_fkey
    FOREIGN KEY (evidencia_id, expediente_id)
    REFERENCES verificacion_entrevista_evidencias(id, expediente_id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_evidencia_integrantes_integrante_fkey
    FOREIGN KEY (expediente_id, integrante_id)
    REFERENCES integrantes(expediente_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_evidencia_integrantes_usuario_fkey
    FOREIGN KEY (asociada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT
);

INSERT INTO verificacion_entrevista_evidencia_integrantes (
  evidencia_id,
  expediente_id,
  integrante_id,
  asociada_por,
  created_at
)
SELECT
  id,
  expediente_id,
  integrante_id,
  registrada_por,
  created_at
FROM verificacion_entrevista_evidencias;

CREATE INDEX ix_verificacion_entrevista_evidencia_integrantes_consulta
  ON verificacion_entrevista_evidencia_integrantes(
    integrante_id,
    created_at,
    evidencia_id
  );

COMMENT ON COLUMN verificacion_entrevista_evidencias.integrante_id IS
  'Integrante desde cuya Entrevista se capturo el archivo; no limita a quienes aplica la evidencia.';
COMMENT ON COLUMN verificacion_entrevista_evidencias.expediente_id IS
  'Expediente de origen que limita todas las asociaciones de la evidencia.';
COMMENT ON TABLE verificacion_entrevista_evidencia_integrantes IS
  'Asociaciones auditables entre una sola fotografia de Entrevista y una o varias integrantes del mismo expediente.';

COMMIT;
