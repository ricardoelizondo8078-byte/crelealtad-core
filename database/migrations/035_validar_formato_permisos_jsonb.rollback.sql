BEGIN;

ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_permisos_personalizados_elementos_check;

ALTER TABLE public.roles
  DROP CONSTRAINT IF EXISTS roles_permisos_formato_check;

COMMIT;
