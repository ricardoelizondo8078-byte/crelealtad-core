BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.solicitudes_documentos
     WHERE doc_control_pagos_ruta IS NOT NULL
        OR doc_control_pagos_fecha IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Rollback 070 bloqueado: existen controles de pagos CRELEALTAD confirmados';
  END IF;
END $$;

ALTER TABLE public.solicitudes_documentos
  DROP COLUMN doc_control_pagos_fecha,
  DROP COLUMN doc_control_pagos_ruta;

COMMIT;
