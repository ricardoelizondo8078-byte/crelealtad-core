BEGIN;

ALTER TABLE public.creditos
  DROP CONSTRAINT IF EXISTS fk_creditos_solicitud;

ALTER TABLE public.solicitudes_domicilios
  DROP CONSTRAINT IF EXISTS fk_solicitudes_domicilios_dom_cp;

ALTER TABLE public.solicitudes_negocios
  DROP CONSTRAINT IF EXISTS fk_solicitudes_negocios_negocio_cp;

COMMIT;
