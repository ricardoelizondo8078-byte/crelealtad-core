BEGIN;

ALTER TABLE verificacion_entrevista_negocio_evidencias
  DROP CONSTRAINT IF EXISTS verificacion_entrevista_negocio_origen_check;

ALTER TABLE verificacion_entrevista_negocio_evidencias
  ADD CONSTRAINT verificacion_entrevista_negocio_origen_check
  CHECK (origen IN ('GALERIA', 'CAMARA'));

COMMENT ON COLUMN verificacion_entrevista_negocio_evidencias.origen IS
  'CAMARA es la unica fuente permitida para nuevas capturas; GALERIA se conserva solo para historial previo.';

COMMIT;

-- Reversión manual segura:
-- Solo puede restaurarse CHECK (origen = 'GALERIA') si no existen filas con origen CAMARA.
