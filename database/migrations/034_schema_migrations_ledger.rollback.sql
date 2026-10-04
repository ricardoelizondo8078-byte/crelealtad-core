BEGIN;

DO $$
BEGIN
  IF to_regclass('public.schema_migrations') IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.schema_migrations) THEN
    RAISE EXCEPTION 'No se puede eliminar schema_migrations mientras contenga historial';
  END IF;
END
$$;

DROP TABLE IF EXISTS public.schema_migrations;

COMMIT;
