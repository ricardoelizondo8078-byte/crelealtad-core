BEGIN;

DO $$
DECLARE
  hay_filas BOOLEAN;
BEGIN
  IF to_regclass('public.verificacion_entrevista_telefono_confirmaciones') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.verificacion_entrevista_telefono_confirmaciones)'
      INTO hay_filas;
    IF hay_filas THEN
      RAISE EXCEPTION 'No se puede revertir: existen confirmaciones telefónicas que deben conservarse como historial';
    END IF;
  END IF;
END
$$;

DROP TABLE IF EXISTS verificacion_entrevista_telefono_confirmaciones;

COMMIT;
