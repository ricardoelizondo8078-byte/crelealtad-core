BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM ciclos WHERE expediente_id IS NULL) THEN
    RAISE EXCEPTION 'No se puede reforzar ciclos.expediente_id: existen ciclos sin expediente';
  END IF;

  IF EXISTS (
    SELECT expediente_id
    FROM ciclos
    GROUP BY expediente_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'No se puede reforzar ciclos.expediente_id: un expediente aparece en más de un ciclo';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM ciclos c
    JOIN expedientes e ON e.id = c.expediente_id
    WHERE c.grupo_id IS DISTINCT FROM e.grupo_id
  ) THEN
    RAISE EXCEPTION 'No se puede reforzar ciclo-expediente: existen asociaciones entre grupos distintos';
  END IF;
END
$$;

ALTER TABLE expedientes
  ADD CONSTRAINT uq_expedientes_id_grupo_id UNIQUE (id, grupo_id);

ALTER TABLE ciclos
  ALTER COLUMN expediente_id SET NOT NULL;

ALTER TABLE ciclos
  ADD CONSTRAINT uq_ciclos_expediente_id UNIQUE (expediente_id);

ALTER TABLE ciclos
  DROP CONSTRAINT fk_ciclo_expediente;

ALTER TABLE ciclos
  ADD CONSTRAINT fk_ciclos_expediente_grupo
  FOREIGN KEY (expediente_id, grupo_id)
  REFERENCES expedientes (id, grupo_id)
  ON DELETE RESTRICT;

COMMENT ON COLUMN ciclos.expediente_id IS
  'Expediente único que originó el ciclo durante el desembolso real.';

COMMIT;
