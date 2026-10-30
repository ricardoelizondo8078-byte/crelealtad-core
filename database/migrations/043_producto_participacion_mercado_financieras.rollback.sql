BEGIN;

DROP TABLE public.financieras_competidoras_sucursales_version;

ALTER TABLE public.financieras_competidoras_versiones
  DROP COLUMN refinanciamiento,
  DROP COLUMN base,
  DROP COLUMN retencion,
  DROP COLUMN apertura,
  DROP COLUMN seguro,
  DROP COLUMN tasa,
  DROP COLUMN semanas;

COMMIT;
