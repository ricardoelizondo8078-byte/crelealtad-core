BEGIN;

DO $$
DECLARE
  hay_filas BOOLEAN;
BEGIN
  IF to_regclass('public.verificacion_entrevista_negocio_evidencias') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.verificacion_entrevista_negocio_evidencias)'
      INTO hay_filas;
    IF hay_filas THEN
      RAISE EXCEPTION 'No se puede revertir: existen fotografias del negocio que deben conservarse como historial';
    END IF;
  END IF;
END
$$;

DROP TABLE IF EXISTS verificacion_entrevista_negocio_evidencias;

COMMIT;
