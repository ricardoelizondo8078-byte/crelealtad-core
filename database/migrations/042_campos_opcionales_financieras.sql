BEGIN;

ALTER TABLE public.financieras_competidoras_versiones
  DROP CONSTRAINT ck_financieras_competidoras_clasificacion,
  ALTER COLUMN clasificacion DROP NOT NULL,
  ADD CONSTRAINT ck_financieras_competidoras_clasificacion
    CHECK (
      clasificacion IS NULL
      OR clasificacion IN ('OBJETIVO', 'REVISION', 'NO_PRIORITARIA')
    ),
  DROP CONSTRAINT ck_financieras_competidoras_motivo,
  ALTER COLUMN motivo DROP NOT NULL,
  ADD CONSTRAINT ck_financieras_competidoras_motivo
    CHECK (motivo IS NULL OR BTRIM(motivo) <> '');

COMMENT ON COLUMN public.financieras_competidoras_versiones.clasificacion IS
  'Clasificación opcional. NULL representa una financiera sin clasificar.';

COMMENT ON COLUMN public.financieras_competidoras_versiones.motivo IS
  'Motivo histórico opcional; dejó de capturarse en la propuesta simplificada de M11.';

COMMIT;
