BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.verificacion_visita_vecino_opciones) THEN
    RAISE EXCEPTION
      'No se puede revertir 064: existen opciones históricas registradas en visitas al vecino';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.parametros_entrevista_opciones
    WHERE familia IN ('VISITA_VECINO_RESPUESTA_SI', 'VISITA_VECINO_RESPUESTA_NO')
  ) THEN
    RAISE EXCEPTION
      'No se puede revertir 064: existen opciones configuradas para visitas al vecino';
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_opcion_respuesta_visita_vecino
  ON public.verificacion_visita_vecino_opciones;
DROP FUNCTION IF EXISTS public.validar_opcion_respuesta_visita_vecino();
DROP TABLE IF EXISTS public.verificacion_visita_vecino_opciones;

ALTER TABLE public.parametros_entrevista_opciones
  DROP CONSTRAINT chk_parametros_entrevista_familia;

ALTER TABLE public.parametros_entrevista_opciones
  ADD CONSTRAINT chk_parametros_entrevista_familia CHECK (familia IN (
    'COMO_CONOCIO_ASESORA', 'ANTIGUEDAD_CONOCE_GRUPO', 'MOTIVO_DESACUERDO_MONTOS',
    'MOTIVO_NO_RENOVACION', 'MOTIVO_NO_VIVE_DOMICILIO', 'TIPO_DOMICILIO',
    'FAMILIAR_DOMICILIO', 'ANTIGUEDAD_DOMICILIO', 'PERSONAS_VIVEN_CASA',
    'CONVIVIENTES', 'FUENTES_INGRESO', 'ANTIGUEDAD_LABORAL',
    'MOTIVO_SIN_CONTROL_PAGOS', 'FRECUENCIA_SERVICIO', 'CALIFICACION_SERVICIO',
    'RAPIDEZ_DESEMBOLSO', 'MOTIVO_RECOMENDACION_SI', 'MOTIVO_RECOMENDACION_NO'
  ));

COMMENT ON TABLE public.parametros_entrevista_opciones IS
  'Catálogos administrables usados por la entrevista de Verificación; código estable, etiqueta y orden editables, baja lógica.';

COMMIT;
