BEGIN;

ALTER TABLE solicitudes
  ADD COLUMN IF NOT EXISTS monto_solicitado_confirmado_at TIMESTAMPTZ NULL;

UPDATE solicitudes AS solicitud
SET monto_solicitado_confirmado_at = COALESCE(solicitud.updated_at, solicitud.created_at, NOW())
FROM solicitudes_validaciones AS validacion
WHERE validacion.solicitud_id = solicitud.id
  AND validacion.tiene_medidor_luz IN ('SI', 'NO')
  AND validacion.vive_max_5km_tesorera IN ('SI', 'NO')
  AND solicitud.monto_solicitado > 0
  AND solicitud.monto_solicitado_confirmado_at IS NULL;

COMMENT ON COLUMN solicitudes.monto_solicitado_confirmado_at IS
  'Fecha en que el asesor capturo explicitamente el monto solicitado; NULL indica una referencia precargada aun no confirmada.';

COMMIT;
