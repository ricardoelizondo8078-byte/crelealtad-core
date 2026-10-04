BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_imagenes_domicilio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integrante_id UUID NOT NULL,
  tipo VARCHAR(40) NOT NULL,
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
  CONSTRAINT verificacion_imagenes_domicilio_integrante_fkey
    FOREIGN KEY (integrante_id)
    REFERENCES integrantes(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_imagenes_domicilio_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_imagenes_domicilio_tipo_check
    CHECK (tipo IN ('NOMENCLATURAS_CALLES', 'FACHADA', 'FACHADA_CON_INTEGRANTE')),
  CONSTRAINT verificacion_imagenes_domicilio_mime_check
    CHECK (mime_type IN ('image/jpeg', 'image/png')),
  CONSTRAINT verificacion_imagenes_domicilio_tamano_check
    CHECK (tamano_bytes > 0 AND tamano_bytes <= 10485760),
  CONSTRAINT verificacion_imagenes_domicilio_sha256_check
    CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  CONSTRAINT verificacion_imagenes_domicilio_captura_fuente_check
    CHECK (captura_fuente = 'CAMARA'),
  CONSTRAINT verificacion_imagenes_domicilio_idempotencia_check
    CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 16 AND 100),
  CONSTRAINT verificacion_imagenes_domicilio_ubicacion_rango
    CHECK (
      ubicacion_latitud BETWEEN -90 AND 90
      AND ubicacion_longitud BETWEEN -180 AND 180
    ),
  CONSTRAINT verificacion_imagenes_domicilio_ubicacion_precision
    CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0),
  CONSTRAINT verificacion_imagenes_domicilio_ubicacion_fuente_check
    CHECK (ubicacion_fuente = 'DISPOSITIVO')
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_verificacion_imagenes_domicilio_actor_idempotencia
  ON verificacion_imagenes_domicilio(registrada_por, idempotency_key);

CREATE INDEX IF NOT EXISTS ix_verificacion_imagenes_domicilio_integrante_tipo_fecha
  ON verificacion_imagenes_domicilio(integrante_id, tipo, created_at DESC);

COMMENT ON TABLE verificacion_imagenes_domicilio IS
  'Historial de imagenes geolocalizadas del domicilio capturadas durante Verificacion.';
COMMENT ON COLUMN verificacion_imagenes_domicilio.tipo IS
  'Tipo controlado: nomenclaturas, fachada o fachada con la integrante.';
COMMENT ON COLUMN verificacion_imagenes_domicilio.ruta IS
  'Ruta protegida del archivo; no es una URL publica.';
COMMENT ON COLUMN verificacion_imagenes_domicilio.captura_fuente IS
  'Fuente declarada por el flujo oficial; CAMARA indica que mobile no ofrece seleccion desde carrete.';
COMMENT ON COLUMN verificacion_imagenes_domicilio.foto_capturada_at IS
  'Fecha y hora registrada por mobile inmediatamente despues de cerrar la camara.';
COMMENT ON COLUMN verificacion_imagenes_domicilio.registrada_por IS
  'Usuario autenticado que realizo y registro esta evidencia de Verificacion.';
COMMENT ON COLUMN verificacion_imagenes_domicilio.ubicacion_capturada_at IS
  'Fecha y hora de la lectura de ubicacion obtenida inmediatamente despues de la fotografia.';

COMMIT;
