BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_entrevista_evidencias
    WHERE tipo IN ('HISTORIAL_CREDITO_ACTIVO', 'HISTORIAL_CREDITO_INACTIVO')
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen evidencias de historial crediticio que deben conservarse';
  END IF;
END
$$;

ALTER TABLE verificacion_entrevista_evidencias
  DROP CONSTRAINT IF EXISTS verificacion_entrevista_evidencias_tipo_check,
  ADD CONSTRAINT verificacion_entrevista_evidencias_tipo_check
    CHECK (tipo IN ('NEGOCIO', 'CONTROL_PAGOS', 'FOLLETO_PREMIO_TESORERA'));

COMMENT ON COLUMN verificacion_entrevista_evidencias.tipo IS NULL;

COMMIT;
