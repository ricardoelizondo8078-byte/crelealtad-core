BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM verificacion_visitas_vecino) THEN
    RAISE EXCEPTION 'No se puede revertir: existen ubicaciones de visitas al vecino que deben conservarse como historial';
  END IF;
END
$$;

ALTER TABLE verificacion_visitas_vecino
  DROP CONSTRAINT IF EXISTS verificacion_visitas_vecino_ubicacion_fuente_check,
  DROP CONSTRAINT IF EXISTS verificacion_visitas_vecino_ubicacion_precision,
  DROP CONSTRAINT IF EXISTS verificacion_visitas_vecino_ubicacion_rango,
  DROP COLUMN IF EXISTS ubicacion_fuente,
  DROP COLUMN IF EXISTS ubicacion_capturada_at,
  DROP COLUMN IF EXISTS ubicacion_precision_metros,
  DROP COLUMN IF EXISTS ubicacion_longitud,
  DROP COLUMN IF EXISTS ubicacion_latitud;

COMMIT;
