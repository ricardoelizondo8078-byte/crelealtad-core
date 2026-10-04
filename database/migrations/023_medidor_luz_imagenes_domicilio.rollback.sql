BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM verificacion_imagenes_domicilio
    WHERE tipo = 'MEDIDOR_LUZ'
  ) THEN
    RAISE EXCEPTION 'No se puede revertir: existen imagenes de medidor de luz que deben conservarse como historial';
  END IF;
END
$$;

ALTER TABLE verificacion_imagenes_domicilio
  DROP CONSTRAINT verificacion_imagenes_domicilio_tipo_check;

ALTER TABLE verificacion_imagenes_domicilio
  ADD CONSTRAINT verificacion_imagenes_domicilio_tipo_check
  CHECK (tipo IN ('NOMENCLATURAS_CALLES', 'FACHADA', 'FACHADA_CON_INTEGRANTE'));

COMMENT ON COLUMN verificacion_imagenes_domicilio.tipo IS
  'Tipo controlado: nomenclaturas, fachada o fachada con la integrante.';

COMMIT;
