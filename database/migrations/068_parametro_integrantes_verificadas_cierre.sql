BEGIN;

CREATE TABLE public.parametros_verificacion_cierre_grupo_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision INTEGER NOT NULL UNIQUE,
  integrantes_verificadas_requeridas INTEGER NOT NULL,
  publicada_por UUID NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  publicada_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_parametros_verificacion_cierre_revision CHECK (revision > 0),
  CONSTRAINT chk_parametros_verificacion_cierre_integrantes CHECK (
    integrantes_verificadas_requeridas > 0
  )
);

COMMENT ON TABLE public.parametros_verificacion_cierre_grupo_versiones IS
  'Versiones inmutables del numero de revisiones individuales concluidas requerido para habilitar el cierre visual de un grupo.';
COMMENT ON COLUMN public.parametros_verificacion_cierre_grupo_versiones.integrantes_verificadas_requeridas IS
  'Cantidad minima de integrantes aprobadas o rechazadas requerida para habilitar Finalizar Verificacion de Grupo.';

COMMIT;
