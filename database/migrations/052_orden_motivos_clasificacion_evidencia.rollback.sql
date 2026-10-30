BEGIN;

ALTER TABLE public.motivos_clasificacion_evidencia
  DROP CONSTRAINT IF EXISTS uq_motivos_clasificacion_evidencia_clasificacion_orden,
  DROP CONSTRAINT IF EXISTS chk_motivos_clasificacion_evidencia_orden,
  DROP COLUMN IF EXISTS orden;

COMMIT;
