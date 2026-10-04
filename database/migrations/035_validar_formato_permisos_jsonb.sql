BEGIN;

ALTER TABLE public.roles
  ADD CONSTRAINT roles_permisos_formato_check
  CHECK (
    permisos IS NULL
    OR (
      jsonb_typeof(permisos) = 'object'
      AND jsonb_typeof(permisos -> 'modulos') = 'array'
      AND jsonb_typeof(permisos -> 'acciones') = 'array'
      AND NOT jsonb_path_exists(
        permisos,
        '$.modulos[*] ? (@.type() != "string")'
      )
      AND NOT jsonb_path_exists(
        permisos,
        '$.acciones[*] ? (@.type() != "string")'
      )
    )
  ) NOT VALID;

ALTER TABLE public.roles
  VALIDATE CONSTRAINT roles_permisos_formato_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_permisos_personalizados_elementos_check
  CHECK (
    permisos_personalizados IS NULL
    OR (
      NOT jsonb_path_exists(
        permisos_personalizados,
        '$.modulos[*] ? (@.type() != "string")'
      )
      AND NOT jsonb_path_exists(
        permisos_personalizados,
        '$.acciones[*] ? (@.type() != "string")'
      )
    )
  ) NOT VALID;

ALTER TABLE public.usuarios
  VALIDATE CONSTRAINT usuarios_permisos_personalizados_elementos_check;

COMMIT;
