BEGIN;

ALTER TABLE verificacion_entrevista_evidencias
  ADD COLUMN clasificacion_semaforo VARCHAR(10),
  ADD CONSTRAINT verificacion_entrevista_evidencias_clasificacion_semaforo_check
    CHECK (
      clasificacion_semaforo IS NULL
      OR (
        tipo IN ('HISTORIAL_CREDITO_ACTIVO', 'HISTORIAL_CREDITO_INACTIVO')
        AND clasificacion_semaforo IN ('VERDE', 'AMARILLO', 'ROJO')
      )
    );

COMMENT ON COLUMN verificacion_entrevista_evidencias.clasificacion_semaforo IS
  'Color elegido por el verificador para una evidencia de otra financiera. NULL conserva el legado sin inventar clasificacion.';

COMMIT;
