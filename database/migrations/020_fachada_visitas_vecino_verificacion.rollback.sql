BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_visitas_vecino
    WHERE fachada_id IS NOT NULL
  ) OR EXISTS (
    SELECT 1
    FROM verificacion_visita_vecino_fachadas
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen fotografias de fachada o visitas relacionadas que deben conservarse como historial';
  END IF;
END
$$;

DROP INDEX IF EXISTS ix_verificacion_visitas_vecino_fachada;

ALTER TABLE verificacion_visitas_vecino
  DROP CONSTRAINT IF EXISTS verificacion_visitas_vecino_fachada_fkey,
  DROP COLUMN IF EXISTS fachada_id;

DROP TABLE IF EXISTS verificacion_visita_vecino_fachadas;

COMMIT;
