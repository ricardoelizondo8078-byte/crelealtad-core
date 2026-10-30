BEGIN;

ALTER TABLE public.verificacion_entrevistas
  ADD COLUMN monto_ultimo_prestamo_credito_grupal NUMERIC(12,2) NULL;

ALTER TABLE public.verificacion_entrevistas
  ADD CONSTRAINT verificacion_entrevistas_monto_ultimo_prestamo_check
    CHECK (
      monto_ultimo_prestamo_credito_grupal IS NULL
      OR monto_ultimo_prestamo_credito_grupal >= 0
    ),
  ADD CONSTRAINT verificacion_entrevistas_ultimo_prestamo_cond_check
    CHECK (
      tiene_otro_credito_grupal IS DISTINCT FROM FALSE
      OR monto_ultimo_prestamo_credito_grupal IS NULL
    );

COMMENT ON COLUMN public.verificacion_entrevistas.monto_ultimo_prestamo_credito_grupal IS
  'Monto declarado del último préstamo grupal recibido en otra financiera.';

COMMIT;
