BEGIN;

DO $$
DECLARE
  hay_filas BOOLEAN;
BEGIN
  IF to_regclass('public.verificacion_imagenes_domicilio') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.verificacion_imagenes_domicilio)'
      INTO hay_filas;
    IF hay_filas THEN
      RAISE EXCEPTION 'No se puede revertir: existen imagenes de domicilio que deben conservarse como historial';
    END IF;
  END IF;
END
$$;

DROP TABLE IF EXISTS verificacion_imagenes_domicilio;

COMMIT;
