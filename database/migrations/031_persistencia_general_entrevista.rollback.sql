BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM verificacion_entrevistas) THEN
    RAISE EXCEPTION 'No se puede revertir: existen entrevistas que deben conservarse como historial';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM verificacion_entrevista_evidencias
    WHERE tipo <> 'NEGOCIO'
       OR legado_sin_ubicacion = FALSE
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen evidencias nuevas o geolocalizadas que deben conservarse';
  END IF;
END
$$;

DROP TABLE IF EXISTS verificacion_entrevista_desacuerdos_montos;
DROP TABLE IF EXISTS verificacion_entrevista_familiares;
DROP TABLE IF EXISTS verificacion_entrevistas;

ALTER INDEX IF EXISTS ux_verificacion_entrevista_evidencia_actor_idempotencia
  RENAME TO ux_verificacion_entrevista_negocio_actor_idempotencia;

ALTER INDEX IF EXISTS ix_verificacion_entrevista_evidencia_integrante_fecha
  RENAME TO ix_verificacion_entrevista_negocio_integrante_fecha;

ALTER TABLE verificacion_entrevista_evidencias
  DROP CONSTRAINT IF EXISTS verificacion_entrevista_evidencias_ubicacion_check,
  DROP CONSTRAINT IF EXISTS verificacion_entrevista_evidencias_fuente_check,
  DROP CONSTRAINT IF EXISTS verificacion_entrevista_evidencias_tipo_check,
  DROP COLUMN IF EXISTS legado_sin_ubicacion,
  DROP COLUMN IF EXISTS ubicacion_fuente,
  DROP COLUMN IF EXISTS ubicacion_capturada_at,
  DROP COLUMN IF EXISTS ubicacion_precision_metros,
  DROP COLUMN IF EXISTS ubicacion_longitud,
  DROP COLUMN IF EXISTS ubicacion_latitud,
  DROP COLUMN IF EXISTS foto_capturada_at,
  DROP COLUMN IF EXISTS tipo;

ALTER TABLE verificacion_entrevista_evidencias
  RENAME COLUMN captura_fuente TO origen;

ALTER TABLE verificacion_entrevista_evidencias
  ADD CONSTRAINT verificacion_entrevista_negocio_origen_check
  CHECK (origen IN ('GALERIA', 'CAMARA'));

ALTER TABLE verificacion_entrevista_evidencias
  RENAME TO verificacion_entrevista_negocio_evidencias;

COMMIT;
