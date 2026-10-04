BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM verificacion_visitas_vecino)
     AND EXISTS (
       SELECT 1
       FROM (VALUES
         ('ubicacion_latitud'),
         ('ubicacion_longitud'),
         ('ubicacion_precision_metros'),
         ('ubicacion_capturada_at'),
         ('ubicacion_fuente')
       ) AS requerida(column_name)
       WHERE NOT EXISTS (
         SELECT 1
         FROM information_schema.columns existente
         WHERE existente.table_schema = 'public'
           AND existente.table_name = 'verificacion_visitas_vecino'
           AND existente.column_name = requerida.column_name
       )
     ) THEN
    RAISE EXCEPTION 'No se puede agregar ubicación obligatoria: existen visitas al vecino sin plan de backfill';
  END IF;
END
$$;

ALTER TABLE verificacion_visitas_vecino
  ADD COLUMN IF NOT EXISTS ubicacion_latitud NUMERIC(10, 7) NOT NULL,
  ADD COLUMN IF NOT EXISTS ubicacion_longitud NUMERIC(11, 7) NOT NULL,
  ADD COLUMN IF NOT EXISTS ubicacion_precision_metros NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS ubicacion_capturada_at TIMESTAMPTZ NOT NULL,
  ADD COLUMN IF NOT EXISTS ubicacion_fuente VARCHAR(20) NOT NULL;

ALTER TABLE verificacion_visitas_vecino
  DROP CONSTRAINT IF EXISTS verificacion_visitas_vecino_ubicacion_rango,
  DROP CONSTRAINT IF EXISTS verificacion_visitas_vecino_ubicacion_precision,
  DROP CONSTRAINT IF EXISTS verificacion_visitas_vecino_ubicacion_fuente_check,
  ADD CONSTRAINT verificacion_visitas_vecino_ubicacion_rango
    CHECK (
      ubicacion_latitud BETWEEN -90 AND 90
      AND ubicacion_longitud BETWEEN -180 AND 180
    ),
  ADD CONSTRAINT verificacion_visitas_vecino_ubicacion_precision
    CHECK (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0),
  ADD CONSTRAINT verificacion_visitas_vecino_ubicacion_fuente_check
    CHECK (ubicacion_fuente = 'DISPOSITIVO');

COMMENT ON COLUMN verificacion_visitas_vecino.ubicacion_latitud IS
  'Latitud actual del dispositivo obtenida al confirmar la respuesta de la visita al vecino.';
COMMENT ON COLUMN verificacion_visitas_vecino.ubicacion_longitud IS
  'Longitud actual del dispositivo obtenida al confirmar la respuesta de la visita al vecino.';
COMMENT ON COLUMN verificacion_visitas_vecino.ubicacion_precision_metros IS
  'Precision horizontal en metros informada por el sistema operativo; puede ser NULL si no fue reportada.';
COMMENT ON COLUMN verificacion_visitas_vecino.ubicacion_capturada_at IS
  'Fecha y hora informada por el dispositivo para la lectura de ubicacion.';
COMMENT ON COLUMN verificacion_visitas_vecino.ubicacion_fuente IS
  'Fuente general de la coordenada; DISPOSITIVO puede combinar GPS, Wi-Fi y red movil.';

COMMIT;
