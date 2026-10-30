BEGIN;

ALTER TABLE public.parametros_conclusiones_semana_credito
  DROP CONSTRAINT IF EXISTS uq_parametros_conclusiones_semana_audit_id,
  DROP COLUMN IF EXISTS audit_id;

COMMIT;
