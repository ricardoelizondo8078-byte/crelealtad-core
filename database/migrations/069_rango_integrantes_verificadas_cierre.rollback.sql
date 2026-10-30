BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.parametros_verificacion_cierre_grupo_versiones
     WHERE integrantes_verificadas_requeridas = 0
  ) THEN
    RAISE EXCEPTION
      'Rollback 069 bloqueado: existen versiones publicadas con cero integrantes requeridas';
  END IF;
END $$;

ALTER TABLE public.parametros_verificacion_cierre_grupo_versiones
  DROP CONSTRAINT chk_parametros_verificacion_cierre_integrantes,
  ADD CONSTRAINT chk_parametros_verificacion_cierre_integrantes CHECK (
    integrantes_verificadas_requeridas > 0
  );

COMMENT ON COLUMN public.parametros_verificacion_cierre_grupo_versiones.integrantes_verificadas_requeridas IS
  'Cantidad minima de integrantes aprobadas o rechazadas requerida para habilitar Finalizar Verificacion de Grupo.';

COMMIT;
