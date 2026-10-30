BEGIN;

ALTER TABLE verificacion_entrevista_evidencia_integrantes
  ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN actualizada_por UUID,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE verificacion_entrevista_evidencia_integrantes
SET actualizada_por = asociada_por;

ALTER TABLE verificacion_entrevista_evidencia_integrantes
  ALTER COLUMN actualizada_por SET NOT NULL,
  ADD CONSTRAINT verificacion_entrevista_evidencia_integrantes_actualizada_por_fkey
    FOREIGN KEY (actualizada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT;

COMMENT ON COLUMN verificacion_entrevista_evidencia_integrantes.activo IS
  'Indica si la evidencia corresponde actualmente a la integrante; una correccion desactiva la relacion sin borrarla.';
COMMENT ON COLUMN verificacion_entrevista_evidencia_integrantes.actualizada_por IS
  'Ultimo usuario que activo o desactivo la asociacion.';
COMMENT ON COLUMN verificacion_entrevista_evidencia_integrantes.updated_at IS
  'Fecha de la ultima activacion o desactivacion de la asociacion.';

COMMIT;
