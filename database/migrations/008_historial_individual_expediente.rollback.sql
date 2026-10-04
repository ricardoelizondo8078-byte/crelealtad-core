BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM expedientes
    WHERE ciclo_historico_origen_id IS NOT NULL OR importacion_integrantes_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'No se puede revertir 008: primero debe restaurarse el respaldo previo a la carga individual';
  END IF;

  IF EXISTS (
    SELECT 1 FROM importaciones_excel WHERE tipo_fuente = 'HISTORIAL_INTEGRANTES'
  ) THEN
    RAISE EXCEPTION 'No se puede revertir 008: existen importaciones de historial individual';
  END IF;
END
$$;

DROP INDEX ix_expedientes_importacion_integrantes;

ALTER TABLE expedientes
  DROP CONSTRAINT fk_expedientes_importacion_integrantes,
  DROP CONSTRAINT fk_expedientes_ciclo_historico_grupo,
  DROP CONSTRAINT uq_expedientes_ciclo_historico_origen,
  DROP CONSTRAINT ck_expedientes_origen_historico_completo,
  DROP COLUMN importacion_integrantes_id,
  DROP COLUMN ciclo_historico_origen_id;

ALTER TABLE historial_grupos_ciclos
  DROP CONSTRAINT uq_historial_grupos_ciclos_id_grupo;

ALTER TABLE importaciones_excel
  DROP CONSTRAINT ck_importaciones_excel_tipo;

ALTER TABLE importaciones_excel
  ADD CONSTRAINT ck_importaciones_excel_tipo
  CHECK (tipo_fuente IN ('HISTORIAL_GRUPOS'));

COMMIT;
