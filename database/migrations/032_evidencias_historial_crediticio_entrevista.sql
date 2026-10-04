BEGIN;

ALTER TABLE verificacion_entrevista_evidencias
  DROP CONSTRAINT IF EXISTS verificacion_entrevista_evidencias_tipo_check,
  ADD CONSTRAINT verificacion_entrevista_evidencias_tipo_check
    CHECK (tipo IN (
      'NEGOCIO',
      'HISTORIAL_CREDITO_ACTIVO',
      'HISTORIAL_CREDITO_INACTIVO',
      'CONTROL_PAGOS',
      'FOLLETO_PREMIO_TESORERA'
    ));

COMMENT ON COLUMN verificacion_entrevista_evidencias.tipo IS
  'Clasifica la evidencia de Entrevista; el historial crediticio separa fotos de un credito activo y de uno inactivo.';

COMMIT;
