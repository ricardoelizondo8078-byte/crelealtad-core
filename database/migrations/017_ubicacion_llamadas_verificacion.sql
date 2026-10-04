BEGIN;

ALTER TABLE verificacion_llamadas
  ADD COLUMN IF NOT EXISTS ubicacion_latitud NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS ubicacion_longitud NUMERIC(11, 7),
  ADD COLUMN IF NOT EXISTS ubicacion_precision_metros NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS ubicacion_capturada_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ubicacion_fuente VARCHAR(20);

ALTER TABLE verificacion_llamadas
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_ubicacion_completa,
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_ubicacion_rango,
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_ubicacion_precision,
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_ubicacion_fuente_check,
  ADD CONSTRAINT verificacion_llamadas_ubicacion_completa
    CHECK (
      (
        ubicacion_latitud IS NULL
        AND ubicacion_longitud IS NULL
        AND ubicacion_precision_metros IS NULL
        AND ubicacion_capturada_at IS NULL
        AND ubicacion_fuente IS NULL
      )
      OR
      (
        ubicacion_latitud IS NOT NULL
        AND ubicacion_longitud IS NOT NULL
        AND ubicacion_capturada_at IS NOT NULL
        AND ubicacion_fuente IS NOT NULL
      )
    ),
  ADD CONSTRAINT verificacion_llamadas_ubicacion_rango
    CHECK (
      ubicacion_latitud IS NULL
      OR (
        ubicacion_latitud BETWEEN -90 AND 90
        AND ubicacion_longitud BETWEEN -180 AND 180
      )
    ),
  ADD CONSTRAINT verificacion_llamadas_ubicacion_precision
    CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0),
  ADD CONSTRAINT verificacion_llamadas_ubicacion_fuente_check
    CHECK (ubicacion_fuente IS NULL OR ubicacion_fuente = 'DISPOSITIVO');

COMMENT ON COLUMN verificacion_llamadas.ubicacion_latitud IS
  'Latitud actual del dispositivo obtenida al confirmar el resultado de la llamada.';
COMMENT ON COLUMN verificacion_llamadas.ubicacion_longitud IS
  'Longitud actual del dispositivo obtenida al confirmar el resultado de la llamada.';
COMMENT ON COLUMN verificacion_llamadas.ubicacion_precision_metros IS
  'Precision horizontal en metros informada por el sistema operativo; puede ser NULL si no fue reportada.';
COMMENT ON COLUMN verificacion_llamadas.ubicacion_capturada_at IS
  'Fecha y hora informada por el dispositivo para la lectura de ubicacion.';
COMMENT ON COLUMN verificacion_llamadas.ubicacion_fuente IS
  'Fuente general de la coordenada; DISPOSITIVO puede combinar GPS, Wi-Fi y red movil.';

COMMIT;
