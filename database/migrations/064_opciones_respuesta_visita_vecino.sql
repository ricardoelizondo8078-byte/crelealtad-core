BEGIN;

ALTER TABLE public.parametros_entrevista_opciones
  DROP CONSTRAINT chk_parametros_entrevista_familia;

ALTER TABLE public.parametros_entrevista_opciones
  ADD CONSTRAINT chk_parametros_entrevista_familia CHECK (familia IN (
    'COMO_CONOCIO_ASESORA', 'ANTIGUEDAD_CONOCE_GRUPO', 'MOTIVO_DESACUERDO_MONTOS',
    'MOTIVO_NO_RENOVACION', 'MOTIVO_NO_VIVE_DOMICILIO', 'TIPO_DOMICILIO',
    'FAMILIAR_DOMICILIO', 'ANTIGUEDAD_DOMICILIO', 'PERSONAS_VIVEN_CASA',
    'CONVIVIENTES', 'FUENTES_INGRESO', 'ANTIGUEDAD_LABORAL',
    'MOTIVO_SIN_CONTROL_PAGOS', 'FRECUENCIA_SERVICIO', 'CALIFICACION_SERVICIO',
    'RAPIDEZ_DESEMBOLSO', 'MOTIVO_RECOMENDACION_SI', 'MOTIVO_RECOMENDACION_NO',
    'VISITA_VECINO_RESPUESTA_SI', 'VISITA_VECINO_RESPUESTA_NO'
  ));

CREATE TABLE public.verificacion_visita_vecino_opciones (
  visita_id UUID NOT NULL,
  opcion_id UUID NOT NULL,
  etiqueta_snapshot VARCHAR(120) NOT NULL,
  orden_snapshot INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_visita_vecino_opciones_pkey
    PRIMARY KEY (visita_id, opcion_id),
  CONSTRAINT verificacion_visita_vecino_opciones_visita_fkey
    FOREIGN KEY (visita_id)
    REFERENCES public.verificacion_visitas_vecino(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_visita_vecino_opciones_opcion_fkey
    FOREIGN KEY (opcion_id)
    REFERENCES public.parametros_entrevista_opciones(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_visita_vecino_opciones_etiqueta_check
    CHECK (char_length(btrim(etiqueta_snapshot)) >= 1),
  CONSTRAINT verificacion_visita_vecino_opciones_orden_check
    CHECK (orden_snapshot >= 1)
);

CREATE INDEX ix_verificacion_visita_vecino_opciones_opcion
  ON public.verificacion_visita_vecino_opciones(opcion_id);

CREATE OR REPLACE FUNCTION public.validar_opcion_respuesta_visita_vecino()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  respuesta_visita BOOLEAN;
  familia_esperada VARCHAR(60);
  opcion_actual RECORD;
BEGIN
  SELECT conoce_y_sabe_donde_vive
    INTO respuesta_visita
  FROM public.verificacion_visitas_vecino
  WHERE id = NEW.visita_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La visita al vecino indicada no existe';
  END IF;

  familia_esperada := CASE
    WHEN respuesta_visita THEN 'VISITA_VECINO_RESPUESTA_SI'
    ELSE 'VISITA_VECINO_RESPUESTA_NO'
  END;

  SELECT familia, etiqueta, orden, activo
    INTO opcion_actual
  FROM public.parametros_entrevista_opciones
  WHERE id = NEW.opcion_id;

  IF NOT FOUND OR opcion_actual.familia <> familia_esperada THEN
    RAISE EXCEPTION 'La opción no corresponde a la respuesta de la visita al vecino';
  END IF;

  IF opcion_actual.activo IS NOT TRUE THEN
    RAISE EXCEPTION 'La opción de la visita al vecino está inactiva';
  END IF;

  NEW.etiqueta_snapshot := opcion_actual.etiqueta;
  NEW.orden_snapshot := opcion_actual.orden;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validar_opcion_respuesta_visita_vecino
BEFORE INSERT OR UPDATE ON public.verificacion_visita_vecino_opciones
FOR EACH ROW
EXECUTE FUNCTION public.validar_opcion_respuesta_visita_vecino();

COMMENT ON TABLE public.verificacion_visita_vecino_opciones IS
  'Opciones múltiples confirmadas para cada respuesta histórica de visita al vecino.';
COMMENT ON COLUMN public.verificacion_visita_vecino_opciones.etiqueta_snapshot IS
  'Texto de la opción al momento de registrar la respuesta; no cambia al editar el catálogo.';
COMMENT ON COLUMN public.verificacion_visita_vecino_opciones.orden_snapshot IS
  'Orden de la opción al momento de registrar la respuesta.';
COMMENT ON TABLE public.parametros_entrevista_opciones IS
  'Catálogos administrables usados por Verificación; código estable, etiqueta y orden editables, baja lógica.';

COMMIT;
