BEGIN;

ALTER TABLE verificacion_imagenes_domicilio
  DROP CONSTRAINT verificacion_imagenes_domicilio_tipo_check;

ALTER TABLE verificacion_imagenes_domicilio
  ADD CONSTRAINT verificacion_imagenes_domicilio_tipo_check
  CHECK (
    tipo IN (
      'NOMENCLATURAS_CALLES',
      'FACHADA',
      'MEDIDOR_LUZ',
      'FACHADA_CON_INTEGRANTE'
    )
  );

COMMENT ON COLUMN verificacion_imagenes_domicilio.tipo IS
  'Tipo controlado: nomenclaturas, fachada, medidor de luz o fachada con la integrante.';

COMMIT;
