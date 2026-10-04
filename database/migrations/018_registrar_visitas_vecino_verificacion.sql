BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_visitas_vecino (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integrante_id UUID NOT NULL,
  conoce_y_sabe_donde_vive BOOLEAN NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  registrada_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_visitas_vecino_integrante_fkey
    FOREIGN KEY (integrante_id)
    REFERENCES integrantes(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_visitas_vecino_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_visitas_vecino_idempotencia_check
    CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 16 AND 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_verificacion_visitas_vecino_actor_idempotencia
  ON verificacion_visitas_vecino(registrada_por, idempotency_key);

CREATE INDEX IF NOT EXISTS ix_verificacion_visitas_vecino_integrante_fecha
  ON verificacion_visitas_vecino(integrante_id, created_at DESC);

COMMENT ON TABLE verificacion_visitas_vecino IS
  'Confirmaciones declaradas por el verificador durante una visita al vecino.';
COMMENT ON COLUMN verificacion_visitas_vecino.conoce_y_sabe_donde_vive IS
  'Respuesta a la pregunta combinada: conoce a la integrante y sabe donde vive.';
COMMENT ON COLUMN verificacion_visitas_vecino.idempotency_key IS
  'Clave estable de la confirmacion para evitar duplicados ante reintentos de red.';

COMMIT;
