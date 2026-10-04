BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_visita_vecino_evidencias
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen fotografias de evidencia de visitas al vecino que deben conservarse como historial';
  END IF;
END
$$;

DROP TABLE IF EXISTS verificacion_visita_vecino_evidencias;

COMMIT;
