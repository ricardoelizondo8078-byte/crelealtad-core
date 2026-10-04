BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM verificacion_medidor_luz_respuestas) THEN
    RAISE EXCEPTION 'No se puede revertir: existen respuestas de medidor de luz que deben conservarse como historial';
  END IF;
END
$$;

DROP TABLE IF EXISTS verificacion_medidor_luz_respuestas;

COMMIT;
