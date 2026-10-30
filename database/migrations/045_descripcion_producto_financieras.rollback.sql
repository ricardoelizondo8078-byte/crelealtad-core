BEGIN;

ALTER TABLE public.financieras_competidoras_versiones
  DROP COLUMN descripcion;

COMMIT;
