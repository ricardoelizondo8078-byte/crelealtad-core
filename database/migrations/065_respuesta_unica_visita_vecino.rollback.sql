BEGIN;

ALTER TABLE public.verificacion_visita_vecino_opciones
  DROP CONSTRAINT IF EXISTS uq_verificacion_visita_vecino_opcion_unica;

COMMENT ON TABLE public.verificacion_visita_vecino_opciones IS
  'Opciones múltiples confirmadas para cada respuesta histórica de visita al vecino.';

COMMIT;
