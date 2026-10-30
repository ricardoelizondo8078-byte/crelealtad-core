BEGIN;

ALTER TABLE public.solicitudes_documentos
  ADD COLUMN doc_control_pagos_ruta VARCHAR(500),
  ADD COLUMN doc_control_pagos_fecha DATE;

COMMENT ON COLUMN public.solicitudes_documentos.doc_control_pagos_ruta IS
  'Ruta vigente del Control de pagos CRELEALTAD requerido para integrantes desde ciclo 2.';

COMMENT ON COLUMN public.solicitudes_documentos.doc_control_pagos_fecha IS
  'Fecha de confirmacion en servidor del Control de pagos CRELEALTAD.';

COMMIT;
