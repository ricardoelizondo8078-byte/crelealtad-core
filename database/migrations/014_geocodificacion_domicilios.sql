BEGIN;

ALTER TABLE solicitudes_domicilios
  ADD COLUMN IF NOT EXISTS dom_latitud NUMERIC(10, 7),
  ADD COLUMN IF NOT EXISTS dom_longitud NUMERIC(11, 7),
  ADD COLUMN IF NOT EXISTS dom_geocodificacion_fuente VARCHAR(40),
  ADD COLUMN IF NOT EXISTS dom_geocodificacion_fecha TIMESTAMPTZ;

ALTER TABLE solicitudes_domicilios
  DROP CONSTRAINT IF EXISTS solicitudes_domicilios_coordenadas_pareadas,
  ADD CONSTRAINT solicitudes_domicilios_coordenadas_pareadas
  CHECK (
    (dom_latitud IS NULL AND dom_longitud IS NULL)
    OR
    (
      dom_latitud IS NOT NULL
      AND dom_longitud IS NOT NULL
      AND dom_latitud BETWEEN -90 AND 90
      AND dom_longitud BETWEEN -180 AND 180
    )
  );

COMMENT ON COLUMN solicitudes_domicilios.dom_latitud IS
  'Latitud aproximada obtenida al geocodificar la direccion capturada; no representa GPS del dispositivo.';
COMMENT ON COLUMN solicitudes_domicilios.dom_longitud IS
  'Longitud aproximada obtenida al geocodificar la direccion capturada; no representa GPS del dispositivo.';
COMMENT ON COLUMN solicitudes_domicilios.dom_geocodificacion_fuente IS
  'Proveedor o mecanismo que convirtio la direccion capturada en coordenadas.';
COMMENT ON COLUMN solicitudes_domicilios.dom_geocodificacion_fecha IS
  'Fecha de la ultima geocodificacion exitosa del domicilio capturado.';

COMMIT;
