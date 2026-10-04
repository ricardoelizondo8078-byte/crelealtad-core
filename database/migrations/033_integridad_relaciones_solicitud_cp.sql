BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_creditos_solicitud'
      AND conrelid = 'public.creditos'::regclass
  ) THEN
    ALTER TABLE public.creditos
      ADD CONSTRAINT fk_creditos_solicitud
      FOREIGN KEY (solicitud_id)
      REFERENCES public.solicitudes(id)
      ON UPDATE NO ACTION
      ON DELETE RESTRICT;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_solicitudes_domicilios_dom_cp'
      AND conrelid = 'public.solicitudes_domicilios'::regclass
  ) THEN
    ALTER TABLE public.solicitudes_domicilios
      ADD CONSTRAINT fk_solicitudes_domicilios_dom_cp
      FOREIGN KEY (dom_cp_id)
      REFERENCES public.codigos_postales(id)
      ON UPDATE NO ACTION
      ON DELETE RESTRICT;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_solicitudes_negocios_negocio_cp'
      AND conrelid = 'public.solicitudes_negocios'::regclass
  ) THEN
    ALTER TABLE public.solicitudes_negocios
      ADD CONSTRAINT fk_solicitudes_negocios_negocio_cp
      FOREIGN KEY (negocio_cp_id)
      REFERENCES public.codigos_postales(id)
      ON UPDATE NO ACTION
      ON DELETE RESTRICT;
  END IF;
END
$$;

COMMIT;
