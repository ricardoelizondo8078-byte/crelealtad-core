BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.financieras_competidoras_sucursales_version
    WHERE orden > 10
  ) THEN
    RAISE EXCEPTION
      'No se puede limitar a diez sucursales: existen registros con orden mayor a 10';
  END IF;
END
$$;

ALTER TABLE public.financieras_competidoras_sucursales_version
  DROP CONSTRAINT ck_financieras_sucursales_version_orden,
  ADD CONSTRAINT ck_financieras_sucursales_version_orden
    CHECK (orden BETWEEN 1 AND 10);

COMMIT;
