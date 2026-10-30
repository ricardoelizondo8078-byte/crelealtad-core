BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_entrevista_evidencias
    WHERE clasificacion_semaforo IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen evidencias con clasificacion de semaforo que se perderia';
  END IF;
END
$$;

ALTER TABLE verificacion_entrevista_evidencias
  DROP CONSTRAINT verificacion_entrevista_evidencias_clasificacion_semaforo_check,
  DROP COLUMN clasificacion_semaforo;

COMMIT;
