BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM solicitudes_domicilios
    WHERE dom_latitud IS NOT NULL OR dom_longitud IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen coordenadas geocodificadas que deben revisarse antes de eliminar columnas';
  END IF;
END
$$;

ALTER TABLE solicitudes_domicilios
  DROP CONSTRAINT IF EXISTS solicitudes_domicilios_coordenadas_pareadas,
  DROP COLUMN IF EXISTS dom_geocodificacion_fecha,
  DROP COLUMN IF EXISTS dom_geocodificacion_fuente,
  DROP COLUMN IF EXISTS dom_longitud,
  DROP COLUMN IF EXISTS dom_latitud;

COMMIT;
