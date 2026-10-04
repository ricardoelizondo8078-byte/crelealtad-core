BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_visita_vecino_evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visita_id UUID NOT NULL,
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
  CONSTRAINT verificacion_visita_vecino_evidencias_visita_fkey
    FOREIGN KEY (visita_id)
    REFERENCES verificacion_visitas_vecino(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_visita_vecino_evidencias_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_visita_vecino_evidencias_mime_check
    CHECK (mime_type IN ('image/jpeg', 'image/png')),
  CONSTRAINT verificacion_visita_vecino_evidencias_tamano_check
    CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760),
  CONSTRAINT verificacion_visita_vecino_evidencias_sha256_check
    CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT verificacion_visita_vecino_evidencias_captura_fuente_check
    CHECK (captura_fuente = 'CAMARA'),
  CONSTRAINT verificacion_visita_vecino_evidencias_idempotencia_check
    CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 16 AND 100),
  CONSTRAINT verificacion_visita_vecino_evidencias_ubicacion_rango
    CHECK (
      ubicacion_latitud BETWEEN -90 AND 90
      AND ubicacion_longitud BETWEEN -180 AND 180
    ),
  CONSTRAINT verificacion_visita_vecino_evidencias_ubicacion_precision
    CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0),
  CONSTRAINT verificacion_visita_vecino_evidencias_ubicacion_fuente_check
    CHECK (ubicacion_fuente = 'DISPOSITIVO')
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_verificacion_visita_vecino_evidencias_actor_idempotencia
  ON verificacion_visita_vecino_evidencias(registrada_por, idempotency_key);

CREATE INDEX IF NOT EXISTS ix_verificacion_visita_vecino_evidencias_visita_fecha
  ON verificacion_visita_vecino_evidencias(visita_id, created_at DESC);

COMMENT ON TABLE verificacion_visita_vecino_evidencias IS
  'Fotografias geolocalizadas tomadas desde la camara despues de responder la pregunta al vecino.';
COMMENT ON COLUMN verificacion_visita_vecino_evidencias.ruta IS
  'Ruta protegida del archivo; no es una URL publica.';
COMMENT ON COLUMN verificacion_visita_vecino_evidencias.captura_fuente IS
  'Fuente declarada por el flujo oficial; CAMARA indica que mobile no ofrece seleccion desde carrete.';
COMMENT ON COLUMN verificacion_visita_vecino_evidencias.foto_capturada_at IS
  'Fecha y hora registrada por mobile inmediatamente despues de cerrar la camara.';
COMMENT ON COLUMN verificacion_visita_vecino_evidencias.ubicacion_capturada_at IS
  'Fecha y hora de la lectura de ubicacion obtenida inmediatamente despues de la fotografia.';

COMMIT;
