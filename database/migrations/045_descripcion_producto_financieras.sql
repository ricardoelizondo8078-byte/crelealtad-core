BEGIN;

ALTER TABLE public.financieras_competidoras_versiones
  ADD COLUMN descripcion TEXT;

COMMENT ON COLUMN public.financieras_competidoras_versiones.descripcion IS
  'Descripción libre y extensa, versionada, del producto de la financiera.';

COMMIT;
