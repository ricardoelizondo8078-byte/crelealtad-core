BEGIN;

ALTER TABLE public.financieras_competidoras_sucursales_version
  DROP CONSTRAINT ck_financieras_sucursales_version_orden,
  ADD CONSTRAINT ck_financieras_sucursales_version_orden
    CHECK (orden BETWEEN 1 AND 100);

COMMIT;
