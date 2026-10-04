BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_entrevista_negocio_evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integrante_id UUID NOT NULL,
  ruta VARCHAR(500) NOT NULL,
  mime_type VARCHAR(20) NOT NULL,
  tamano_bytes INTEGER NOT NULL,
  sha256 CHAR(64) NOT NULL,
  origen VARCHAR(20) NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  registrada_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_entrevista_negocio_integrante_fkey
    FOREIGN KEY (integrante_id)
    REFERENCES integrantes(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_negocio_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_negocio_mime_check
    CHECK (mime_type IN ('image/jpeg', 'image/png')),
  CONSTRAINT verificacion_entrevista_negocio_tamano_check
    CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760),
  CONSTRAINT verificacion_entrevista_negocio_sha256_check
    CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT verificacion_entrevista_negocio_origen_check
    CHECK (origen = 'GALERIA'),
  CONSTRAINT verificacion_entrevista_negocio_idempotencia_check
    CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 16 AND 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_verificacion_entrevista_negocio_actor_idempotencia
  ON verificacion_entrevista_negocio_evidencias(registrada_por, idempotency_key);

CREATE INDEX IF NOT EXISTS ix_verificacion_entrevista_negocio_integrante_fecha
  ON verificacion_entrevista_negocio_evidencias(integrante_id, created_at ASC);

COMMENT ON TABLE verificacion_entrevista_negocio_evidencias IS
  'Historial sin limite de cantidad de fotografias opcionales del negocio anexadas durante Entrevista.';
COMMENT ON COLUMN verificacion_entrevista_negocio_evidencias.ruta IS
  'Ruta protegida del archivo; no es una URL publica.';
COMMENT ON COLUMN verificacion_entrevista_negocio_evidencias.origen IS
  'GALERIA indica que mobile permite seleccionar las fotografias existentes del dispositivo.';

COMMIT;
