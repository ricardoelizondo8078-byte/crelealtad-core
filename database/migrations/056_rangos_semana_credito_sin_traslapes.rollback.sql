BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.parametros_conclusiones_semana_credito
    WHERE NOT (
      verde_desde = 1
      AND verde_desde <= verde_hasta
      AND amarillo_desde = verde_hasta + 1
      AND amarillo_desde <= amarillo_hasta
      AND rojo_desde = amarillo_hasta + 1
      AND rojo_desde <= rojo_hasta
      AND rojo_hasta = 16
    )
  ) THEN
    RAISE EXCEPTION
      'Rollback 056 bloqueado: la configuración vigente no cumple la partición ordenada anterior';
  END IF;
END;
$$;

ALTER TABLE public.parametros_conclusiones_semana_credito
  DROP CONSTRAINT IF EXISTS chk_parametros_conclusiones_semana_sin_traslapes,
  ADD CONSTRAINT chk_parametros_conclusiones_semana_particion CHECK (
    verde_desde = 1
    AND verde_desde <= verde_hasta
    AND amarillo_desde = verde_hasta + 1
    AND amarillo_desde <= amarillo_hasta
    AND rojo_desde = amarillo_hasta + 1
    AND rojo_desde <= rojo_hasta
    AND rojo_hasta = 16
  );

COMMIT;
