BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT visita_id
    FROM public.verificacion_visita_vecino_opciones
    GROUP BY visita_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'No se puede aplicar 065: existen visitas al vecino con más de una opción registrada';
  END IF;
END;
$$;

ALTER TABLE public.verificacion_visita_vecino_opciones
  ADD CONSTRAINT uq_verificacion_visita_vecino_opcion_unica
  UNIQUE (visita_id);

COMMENT ON TABLE public.verificacion_visita_vecino_opciones IS
  'Opción única confirmada para cada respuesta histórica de visita al vecino.';

COMMIT;
