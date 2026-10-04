BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.audit_log AS auditoria
    LEFT JOIN public.usuarios AS usuario ON usuario.id = auditoria.usuario_id
    WHERE auditoria.usuario_id IS NOT NULL
      AND usuario.id IS NULL
  ) THEN
    RAISE EXCEPTION 'audit_log contiene usuario_id sin usuario relacionado';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.grupos
    WHERE created_by IS NOT NULL
      AND (
        NULLIF(BTRIM(created_by::text), '') IS NULL
        OR created_by::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      )
  ) THEN
    RAISE EXCEPTION 'grupos.created_by contiene valores que no son UUID válidos';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.grupos AS grupo
    LEFT JOIN public.usuarios AS usuario ON usuario.id::text = grupo.created_by::text
    WHERE grupo.created_by IS NOT NULL
      AND usuario.id IS NULL
  ) THEN
    RAISE EXCEPTION 'grupos.created_by contiene usuarios inexistentes';
  END IF;

  IF EXISTS (SELECT 1 FROM public.roles WHERE estado NOT IN ('ACTIVO', 'INACTIVO')) THEN
    RAISE EXCEPTION 'roles contiene estados fuera del catálogo aprobado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE estado NOT IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'BLOQUEADO')
  ) THEN
    RAISE EXCEPTION 'usuarios contiene estados fuera del catálogo aprobado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.personas
    WHERE estado NOT IN ('ACTIVA', 'INACTIVA', 'BLOQUEADA', 'DEPURADA_LOGICA')
  ) THEN
    RAISE EXCEPTION 'personas contiene estados fuera del catálogo aprobado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.productos_credito
    WHERE estado NOT IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')
  ) THEN
    RAISE EXCEPTION 'productos_credito contiene estados fuera del catálogo aprobado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.creditos
    WHERE estado NOT IN (
      'BORRADOR',
      'PREPARADO_DESEMBOLSO',
      'DESEMBOLSADO',
      'VIGENTE',
      'VENCIDO',
      'LIQUIDADO',
      'REESTRUCTURADO',
      'CANCELADO'
    )
  ) THEN
    RAISE EXCEPTION 'creditos contiene estados fuera del catálogo aprobado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.ciclos
    WHERE estado NOT IN ('PLANEADO', 'ACTIVO', 'EN_CIERRE', 'CERRADO')
  ) THEN
    RAISE EXCEPTION 'ciclos contiene estados fuera del catálogo aprobado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.pagos
    WHERE estado NOT IN ('PENDIENTE', 'APLICADO', 'PARCIAL', 'VENCIDO', 'REVERSADO')
  ) THEN
    RAISE EXCEPTION 'pagos contiene estados fuera del catálogo aprobado';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'grupos'
      AND column_name = 'created_by'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE public.grupos
      ALTER COLUMN created_by TYPE UUID
      USING created_by::uuid;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_audit_log_usuario'
      AND conrelid = 'public.audit_log'::regclass
  ) THEN
    ALTER TABLE public.audit_log
      ADD CONSTRAINT fk_audit_log_usuario
      FOREIGN KEY (usuario_id)
      REFERENCES public.usuarios(id)
      ON UPDATE NO ACTION
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_grupos_created_by'
      AND conrelid = 'public.grupos'::regclass
  ) THEN
    ALTER TABLE public.grupos
      ADD CONSTRAINT fk_grupos_created_by
      FOREIGN KEY (created_by)
      REFERENCES public.usuarios(id)
      ON UPDATE NO ACTION
      ON DELETE RESTRICT;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_grupos_created_by
  ON public.grupos (created_by)
  WHERE created_by IS NOT NULL;

ALTER TABLE public.creditos
  ALTER COLUMN estado SET DEFAULT 'BORRADOR';

ALTER TABLE public.pagos
  ALTER COLUMN estado SET DEFAULT 'PENDIENTE';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_roles_estado'
      AND conrelid = 'public.roles'::regclass
  ) THEN
    ALTER TABLE public.roles
      ADD CONSTRAINT ck_roles_estado
      CHECK (estado IN ('ACTIVO', 'INACTIVO'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_usuarios_estado'
      AND conrelid = 'public.usuarios'::regclass
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT ck_usuarios_estado
      CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'BLOQUEADO'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_personas_estado'
      AND conrelid = 'public.personas'::regclass
  ) THEN
    ALTER TABLE public.personas
      ADD CONSTRAINT ck_personas_estado
      CHECK (estado IN ('ACTIVA', 'INACTIVA', 'BLOQUEADA', 'DEPURADA_LOGICA'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_productos_credito_estado'
      AND conrelid = 'public.productos_credito'::regclass
  ) THEN
    ALTER TABLE public.productos_credito
      ADD CONSTRAINT ck_productos_credito_estado
      CHECK (estado IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_creditos_estado'
      AND conrelid = 'public.creditos'::regclass
  ) THEN
    ALTER TABLE public.creditos
      ADD CONSTRAINT ck_creditos_estado
      CHECK (
        estado IN (
          'BORRADOR',
          'PREPARADO_DESEMBOLSO',
          'DESEMBOLSADO',
          'VIGENTE',
          'VENCIDO',
          'LIQUIDADO',
          'REESTRUCTURADO',
          'CANCELADO'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_ciclos_estado'
      AND conrelid = 'public.ciclos'::regclass
  ) THEN
    ALTER TABLE public.ciclos
      ADD CONSTRAINT ck_ciclos_estado
      CHECK (estado IN ('PLANEADO', 'ACTIVO', 'EN_CIERRE', 'CERRADO'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_pagos_estado'
      AND conrelid = 'public.pagos'::regclass
  ) THEN
    ALTER TABLE public.pagos
      ADD CONSTRAINT ck_pagos_estado
      CHECK (estado IN ('PENDIENTE', 'APLICADO', 'PARCIAL', 'VENCIDO', 'REVERSADO'));
  END IF;
END
$$;

COMMIT;
