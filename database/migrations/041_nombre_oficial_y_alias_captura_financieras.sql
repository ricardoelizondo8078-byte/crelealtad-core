BEGIN;

ALTER TABLE public.financieras_competidoras_versiones
  ADD COLUMN nombre_oficial VARCHAR(120),
  ADD COLUMN nombre_normalizado VARCHAR(120);

UPDATE public.financieras_competidoras_versiones AS version
SET nombre_oficial = financiera.nombre_oficial,
    nombre_normalizado = financiera.nombre_normalizado
FROM public.financieras_competidoras AS financiera
WHERE financiera.id = version.financiera_id;

ALTER TABLE public.financieras_competidoras_versiones
  ALTER COLUMN nombre_oficial SET NOT NULL,
  ALTER COLUMN nombre_normalizado SET NOT NULL,
  ADD CONSTRAINT ck_financieras_competidoras_version_nombre
    CHECK (
      BTRIM(nombre_oficial) <> ''
      AND BTRIM(nombre_normalizado) <> ''
    );

COMMENT ON COLUMN public.financieras_competidoras_versiones.nombre_oficial IS
  'Nombre oficial propuesto y aprobado para la financiera en esta revisión.';

COMMENT ON COLUMN public.financieras_competidoras_versiones.nombre_normalizado IS
  'Nombre oficial normalizado para validar unicidad antes de publicar la revisión.';

COMMIT;
