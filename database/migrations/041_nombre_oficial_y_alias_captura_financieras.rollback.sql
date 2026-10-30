BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.financieras_competidoras_versiones AS version
    INNER JOIN public.financieras_competidoras AS financiera
      ON financiera.id = version.financiera_id
    WHERE version.nombre_normalizado IS DISTINCT FROM financiera.nombre_normalizado
  ) THEN
    RAISE EXCEPTION
      'No se puede revertir 041 porque existe historial con un nombre oficial distinto al vigente';
  END IF;
END
$$;

ALTER TABLE public.financieras_competidoras_versiones
  DROP CONSTRAINT ck_financieras_competidoras_version_nombre,
  DROP COLUMN nombre_normalizado,
  DROP COLUMN nombre_oficial;

COMMIT;
