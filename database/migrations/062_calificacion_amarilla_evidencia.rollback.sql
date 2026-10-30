BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.verificacion_entrevista_evidencia_integrantes
    WHERE calificacion_revision = 'AMARILLO'
  ) THEN
    RAISE EXCEPTION
      'No se puede revertir 062: existen calificaciones AMARILLO de evidencia por integrante';
  END IF;
END
$$;

ALTER TABLE public.verificacion_entrevista_evidencia_integrantes
  DROP CONSTRAINT chk_ver_ent_evid_int_calificacion,
  ADD CONSTRAINT chk_ver_ent_evid_int_calificacion
    CHECK (
      calificacion_revision IS NULL
      OR calificacion_revision IN ('TACHA', 'PALOMITA')
    );

COMMENT ON COLUMN public.verificacion_entrevista_evidencia_integrantes.calificacion_revision
  IS 'Calificación independiente de la evidencia para esta integrante: TACHA o PALOMITA.';

COMMIT;
