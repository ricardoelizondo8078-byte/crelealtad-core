BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM verificacion_visitas_vecino) THEN
    RAISE EXCEPTION 'No se puede revertir: existen visitas al vecino que deben conservarse como historial';
  END IF;
END
$$;

DROP TABLE IF EXISTS verificacion_visitas_vecino;

COMMIT;
