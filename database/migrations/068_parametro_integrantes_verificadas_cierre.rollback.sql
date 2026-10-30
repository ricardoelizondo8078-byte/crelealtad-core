BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.parametros_verificacion_cierre_grupo_versiones
  ) THEN
    RAISE EXCEPTION
      'Rollback 068 bloqueado: existen versiones publicadas del parametro de cierre de grupo';
  END IF;
END $$;

DROP TABLE public.parametros_verificacion_cierre_grupo_versiones;

COMMIT;
