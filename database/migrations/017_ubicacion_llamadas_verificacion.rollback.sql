BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_llamadas
    WHERE ubicacion_latitud IS NOT NULL
       OR ubicacion_longitud IS NOT NULL
       OR ubicacion_precision_metros IS NOT NULL
       OR ubicacion_capturada_at IS NOT NULL
       OR ubicacion_fuente IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen ubicaciones de llamadas que deben conservarse como historial';
  END IF;
END
$$;

ALTER TABLE verificacion_llamadas
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_ubicacion_fuente_check,
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_ubicacion_precision,
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_ubicacion_rango,
  DROP CONSTRAINT IF EXISTS verificacion_llamadas_ubicacion_completa,
  DROP COLUMN IF EXISTS ubicacion_fuente,
  DROP COLUMN IF EXISTS ubicacion_capturada_at,
  DROP COLUMN IF EXISTS ubicacion_precision_metros,
  DROP COLUMN IF EXISTS ubicacion_longitud,
  DROP COLUMN IF EXISTS ubicacion_latitud;

COMMIT;
