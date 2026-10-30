BEGIN;

ALTER TABLE public.parametros_conclusiones_semana_credito
  ADD COLUMN audit_id UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD CONSTRAINT uq_parametros_conclusiones_semana_audit_id UNIQUE (audit_id);

COMMIT;
