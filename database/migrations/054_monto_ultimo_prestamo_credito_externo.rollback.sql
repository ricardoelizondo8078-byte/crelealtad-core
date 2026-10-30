BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.verificacion_entrevistas
    WHERE monto_ultimo_prestamo_credito_grupal IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Rollback 054 bloqueado: existen montos de último préstamo que se perderían';
  END IF;
END;
$$;

ALTER TABLE public.verificacion_entrevistas
  DROP CONSTRAINT IF EXISTS verificacion_entrevistas_ultimo_prestamo_cond_check,
  DROP CONSTRAINT IF EXISTS verificacion_entrevistas_monto_ultimo_prestamo_check,
  DROP COLUMN IF EXISTS monto_ultimo_prestamo_credito_grupal;

COMMIT;
