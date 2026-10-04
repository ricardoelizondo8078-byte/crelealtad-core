BEGIN;

ALTER TABLE solicitudes
  DROP COLUMN IF EXISTS monto_solicitado_confirmado_at;

COMMIT;
