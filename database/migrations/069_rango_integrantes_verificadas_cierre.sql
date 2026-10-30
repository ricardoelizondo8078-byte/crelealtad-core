BEGIN;

ALTER TABLE public.parametros_verificacion_cierre_grupo_versiones
  DROP CONSTRAINT chk_parametros_verificacion_cierre_integrantes,
  ADD CONSTRAINT chk_parametros_verificacion_cierre_integrantes CHECK (
    integrantes_verificadas_requeridas BETWEEN 0 AND 12
  );

COMMENT ON COLUMN public.parametros_verificacion_cierre_grupo_versiones.integrantes_verificadas_requeridas IS
  'Cantidad entre 0 y 12 de integrantes aprobadas o rechazadas requerida para habilitar Finalizar Verificacion de Grupo.';

COMMIT;
