BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.financieras_competidoras_versiones
    WHERE clasificacion IS NULL OR motivo IS NULL
  ) THEN
    RAISE EXCEPTION
      'No se puede revertir 042 porque existen versiones con clasificación o motivo opcional';
  END IF;
END
$$;

ALTER TABLE public.financieras_competidoras_versiones
  DROP CONSTRAINT ck_financieras_competidoras_clasificacion,
  ALTER COLUMN clasificacion SET NOT NULL,
  ADD CONSTRAINT ck_financieras_competidoras_clasificacion
    CHECK (clasificacion IN ('OBJETIVO', 'REVISION', 'NO_PRIORITARIA')),
  DROP CONSTRAINT ck_financieras_competidoras_motivo,
  ALTER COLUMN motivo SET NOT NULL,
  ADD CONSTRAINT ck_financieras_competidoras_motivo
    CHECK (BTRIM(motivo) <> '');

COMMENT ON COLUMN public.financieras_competidoras_versiones.clasificacion IS NULL;
COMMENT ON COLUMN public.financieras_competidoras_versiones.motivo IS NULL;

COMMIT;
