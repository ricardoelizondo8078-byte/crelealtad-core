BEGIN;

ALTER TABLE public.parametros_conclusiones_semana_credito
  DROP CONSTRAINT IF EXISTS chk_parametros_conclusiones_semana_particion,
  ADD CONSTRAINT chk_parametros_conclusiones_semana_sin_traslapes CHECK (
    verde_desde <= verde_hasta
    AND amarillo_desde <= amarillo_hasta
    AND rojo_desde <= rojo_hasta
    AND (verde_hasta < amarillo_desde OR amarillo_hasta < verde_desde)
    AND (verde_hasta < rojo_desde OR rojo_hasta < verde_desde)
    AND (amarillo_hasta < rojo_desde OR rojo_hasta < amarillo_desde)
  );

COMMIT;
