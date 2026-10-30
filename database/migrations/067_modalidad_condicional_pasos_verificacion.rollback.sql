BEGIN;

ALTER TABLE public.parametros_verificacion_pasos_reglas
  DROP CONSTRAINT IF EXISTS chk_parametros_verificacion_pasos_compatibilidad,
  DROP CONSTRAINT IF EXISTS chk_parametros_verificacion_pasos_dias,
  DROP CONSTRAINT IF EXISTS chk_parametros_verificacion_pasos_modalidad,
  DROP COLUMN IF EXISTS dias_para_obligatorio,
  DROP COLUMN IF EXISTS modalidad;

COMMIT;
