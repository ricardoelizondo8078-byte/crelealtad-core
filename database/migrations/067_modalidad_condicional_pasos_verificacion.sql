BEGIN;

ALTER TABLE public.parametros_verificacion_pasos_reglas
  ADD COLUMN modalidad VARCHAR(40),
  ADD COLUMN dias_para_obligatorio INTEGER;

UPDATE public.parametros_verificacion_pasos_reglas
SET modalidad = CASE
  WHEN obligatorio THEN 'OBLIGATORIO'
  ELSE 'OPCIONAL'
END;

ALTER TABLE public.parametros_verificacion_pasos_reglas
  ALTER COLUMN modalidad SET NOT NULL,
  ADD CONSTRAINT chk_parametros_verificacion_pasos_modalidad CHECK (
    modalidad IN ('OBLIGATORIO', 'OPCIONAL', 'OBLIGATORIO_DESPUES_DIAS')
  ),
  ADD CONSTRAINT chk_parametros_verificacion_pasos_dias CHECK (
    (modalidad = 'OBLIGATORIO_DESPUES_DIAS'
      AND dias_para_obligatorio BETWEEN 1 AND 3650)
    OR
    (modalidad <> 'OBLIGATORIO_DESPUES_DIAS'
      AND dias_para_obligatorio IS NULL)
  ),
  ADD CONSTRAINT chk_parametros_verificacion_pasos_compatibilidad CHECK (
    obligatorio = (modalidad = 'OBLIGATORIO')
  );

COMMENT ON COLUMN public.parametros_verificacion_pasos_reglas.modalidad IS
  'OBLIGATORIO, OPCIONAL u OBLIGATORIO_DESPUES_DIAS para el proceso y tipo de integrante.';
COMMENT ON COLUMN public.parametros_verificacion_pasos_reglas.dias_para_obligatorio IS
  'Plazo entero para convertir una regla condicional en obligatoria; NULL para las demás modalidades.';

COMMIT;
