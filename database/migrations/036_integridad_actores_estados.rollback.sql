BEGIN;

ALTER TABLE public.pagos
  DROP CONSTRAINT IF EXISTS ck_pagos_estado;

ALTER TABLE public.ciclos
  DROP CONSTRAINT IF EXISTS ck_ciclos_estado;

ALTER TABLE public.creditos
  DROP CONSTRAINT IF EXISTS ck_creditos_estado;

ALTER TABLE public.productos_credito
  DROP CONSTRAINT IF EXISTS ck_productos_credito_estado;

ALTER TABLE public.personas
  DROP CONSTRAINT IF EXISTS ck_personas_estado;

ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS ck_usuarios_estado;

ALTER TABLE public.roles
  DROP CONSTRAINT IF EXISTS ck_roles_estado;

ALTER TABLE public.pagos
  ALTER COLUMN estado SET DEFAULT 'REGISTRADO';

ALTER TABLE public.creditos
  ALTER COLUMN estado SET DEFAULT 'ACTIVO';

ALTER TABLE public.grupos
  DROP CONSTRAINT IF EXISTS fk_grupos_created_by;

ALTER TABLE public.audit_log
  DROP CONSTRAINT IF EXISTS fk_audit_log_usuario;

DROP INDEX IF EXISTS public.idx_grupos_created_by;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'grupos'
      AND column_name = 'created_by'
      AND data_type = 'uuid'
  ) THEN
    ALTER TABLE public.grupos
      ALTER COLUMN created_by TYPE VARCHAR
      USING created_by::text;
  END IF;
END
$$;

COMMIT;
