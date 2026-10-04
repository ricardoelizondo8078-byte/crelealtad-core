BEGIN;

ALTER TABLE importaciones_excel
  DROP CONSTRAINT ck_importaciones_excel_tipo;

ALTER TABLE importaciones_excel
  ADD CONSTRAINT ck_importaciones_excel_tipo
  CHECK (tipo_fuente IN ('HISTORIAL_GRUPOS', 'HISTORIAL_INTEGRANTES'));

ALTER TABLE historial_grupos_ciclos
  ADD CONSTRAINT uq_historial_grupos_ciclos_id_grupo UNIQUE (id, grupo_id);

ALTER TABLE expedientes
  ADD COLUMN ciclo_historico_origen_id UUID,
  ADD COLUMN importacion_integrantes_id UUID;

ALTER TABLE expedientes
  ADD CONSTRAINT ck_expedientes_origen_historico_completo CHECK (
    (ciclo_historico_origen_id IS NULL AND importacion_integrantes_id IS NULL)
    OR
    (ciclo_historico_origen_id IS NOT NULL AND importacion_integrantes_id IS NOT NULL)
  ),
  ADD CONSTRAINT uq_expedientes_ciclo_historico_origen UNIQUE (ciclo_historico_origen_id),
  ADD CONSTRAINT fk_expedientes_ciclo_historico_grupo
    FOREIGN KEY (ciclo_historico_origen_id, grupo_id)
    REFERENCES historial_grupos_ciclos (id, grupo_id)
    ON DELETE RESTRICT,
  ADD CONSTRAINT fk_expedientes_importacion_integrantes
    FOREIGN KEY (importacion_integrantes_id)
    REFERENCES importaciones_excel (id)
    ON DELETE RESTRICT;

CREATE INDEX ix_expedientes_importacion_integrantes
  ON expedientes (importacion_integrantes_id)
  WHERE importacion_integrantes_id IS NOT NULL;

COMMENT ON COLUMN expedientes.ciclo_historico_origen_id IS
  'Ciclo grupal importado al que pertenece este expediente histórico fuente.';

COMMENT ON COLUMN expedientes.importacion_integrantes_id IS
  'Importación individual que originó integrantes y montos autorizados históricos.';

COMMIT;
