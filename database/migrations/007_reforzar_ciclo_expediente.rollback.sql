BEGIN;

ALTER TABLE ciclos
  DROP CONSTRAINT fk_ciclos_expediente_grupo;

ALTER TABLE ciclos
  DROP CONSTRAINT uq_ciclos_expediente_id;

ALTER TABLE ciclos
  ALTER COLUMN expediente_id DROP NOT NULL;

ALTER TABLE ciclos
  ADD CONSTRAINT fk_ciclo_expediente
  FOREIGN KEY (expediente_id)
  REFERENCES expedientes (id)
  ON DELETE NO ACTION;

ALTER TABLE expedientes
  DROP CONSTRAINT uq_expedientes_id_grupo_id;

COMMENT ON COLUMN ciclos.expediente_id IS NULL;

COMMIT;
