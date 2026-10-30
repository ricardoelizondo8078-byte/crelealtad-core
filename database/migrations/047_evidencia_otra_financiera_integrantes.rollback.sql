BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_entrevista_evidencias evidencia
    LEFT JOIN verificacion_entrevista_evidencia_integrantes asociacion
      ON asociacion.evidencia_id = evidencia.id
    GROUP BY evidencia.id, evidencia.integrante_id
    HAVING COUNT(asociacion.integrante_id) <> 1
       OR BOOL_OR(asociacion.integrante_id <> evidencia.integrante_id)
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen evidencias asociadas a integrantes distintas de la captura original';
  END IF;
END
$$;

DROP TABLE verificacion_entrevista_evidencia_integrantes;

ALTER TABLE verificacion_entrevista_evidencias
  DROP CONSTRAINT verificacion_entrevista_evidencias_expediente_integrante_fkey,
  DROP CONSTRAINT verificacion_entrevista_evidencias_id_expediente_key,
  DROP COLUMN expediente_id;

COMMENT ON COLUMN verificacion_entrevista_evidencias.integrante_id IS NULL;

COMMIT;
