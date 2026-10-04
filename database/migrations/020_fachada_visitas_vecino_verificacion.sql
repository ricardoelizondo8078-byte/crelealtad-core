BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_visita_vecino_fachadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integrante_id UUID NOT NULL,
  ruta VARCHAR(500) NOT NULL,
  mime_type VARCHAR(20) NOT NULL,
  tamano_bytes INTEGER NOT NULL,
  sha256 CHAR(64) NOT NULL,
  captura_fuente VARCHAR(20) NOT NULL,
  foto_capturada_at TIMESTAMPTZ NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  registrada_por UUID NOT NULL,
  ubicacion_latitud NUMERIC(10, 7) NOT NULL,
  ubicacion_longitud NUMERIC(11, 7) NOT NULL,
  ubicacion_precision_metros NUMERIC(10, 2),
  ubicacion_capturada_at TIMESTAMPTZ NOT NULL,
  ubicacion_fuente VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_visita_vecino_fachadas_integrante_fkey
    FOREIGN KEY (integrante_id)
    REFERENCES integrantes(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_visita_vecino_fachadas_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_visita_vecino_fachadas_mime_check
    CHECK (mime_type IN ('image/jpeg', 'image/png')),
  CONSTRAINT verificacion_visita_vecino_fachadas_tamano_check
    CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760),
  CONSTRAINT verificacion_visita_vecino_fachadas_sha256_check
    CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT verificacion_visita_vecino_fachadas_captura_fuente_check
    CHECK (captura_fuente = 'CAMARA'),
  CONSTRAINT verificacion_visita_vecino_fachadas_idempotencia_check
    CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 16 AND 100),
  CONSTRAINT verificacion_visita_vecino_fachadas_ubicacion_rango
    CHECK (
      ubicacion_latitud BETWEEN -90 AND 90
      AND ubicacion_longitud BETWEEN -180 AND 180
    ),
  CONSTRAINT verificacion_visita_vecino_fachadas_ubicacion_precision
    CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0),
  CONSTRAINT verificacion_visita_vecino_fachadas_ubicacion_fuente_check
    CHECK (ubicacion_fuente = 'DISPOSITIVO')
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_verificacion_visita_vecino_fachadas_actor_idempotencia
  ON verificacion_visita_vecino_fachadas(registrada_por, idempotency_key);

CREATE INDEX IF NOT EXISTS ix_verificacion_visita_vecino_fachadas_integrante_fecha
  ON verificacion_visita_vecino_fachadas(integrante_id, created_at DESC);

ALTER TABLE verificacion_visitas_vecino
  ADD COLUMN IF NOT EXISTS fachada_id UUID;

ALTER TABLE verificacion_visitas_vecino
  DROP CONSTRAINT IF EXISTS verificacion_visitas_vecino_fachada_fkey,
  ADD CONSTRAINT verificacion_visitas_vecino_fachada_fkey
    FOREIGN KEY (fachada_id)
    REFERENCES verificacion_visita_vecino_fachadas(id)
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS ix_verificacion_visitas_vecino_fachada
  ON verificacion_visitas_vecino(fachada_id)
  WHERE fachada_id IS NOT NULL;

COMMENT ON TABLE verificacion_visita_vecino_fachadas IS
  'Fotografias de fachada capturadas desde la camara como primer paso de Visita al vecino.';
COMMENT ON COLUMN verificacion_visita_vecino_fachadas.ruta IS
  'Ruta protegida del archivo; no es una URL publica.';
COMMENT ON COLUMN verificacion_visita_vecino_fachadas.captura_fuente IS
  'Fuente declarada por el flujo oficial; CAMARA indica que mobile no ofrece seleccion desde carrete.';
COMMENT ON COLUMN verificacion_visita_vecino_fachadas.foto_capturada_at IS
  'Fecha y hora registrada por mobile inmediatamente despues de cerrar la camara.';
COMMENT ON COLUMN verificacion_visita_vecino_fachadas.ubicacion_capturada_at IS
  'Fecha y hora de la lectura de ubicacion obtenida inmediatamente despues de la fotografia.';
COMMENT ON COLUMN verificacion_visitas_vecino.fachada_id IS
  'Fachada confirmada antes de responder al vecino; NULL unicamente para registros anteriores a la migracion 020.';

COMMIT;
