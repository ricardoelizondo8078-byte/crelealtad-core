BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.verificacion_entrevista_evidencia_integrantes
    WHERE calificacion_revision IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'No se puede revertir 061: existen calificaciones de evidencia por integrante';
  END IF;
END $$;

ALTER TABLE public.verificacion_entrevista_evidencia_integrantes
  DROP CONSTRAINT fk_ver_ent_evid_int_calificada_por,
  DROP CONSTRAINT chk_ver_ent_evid_int_calificacion_actor,
  DROP CONSTRAINT chk_ver_ent_evid_int_calificacion,
  DROP COLUMN calificada_at,
  DROP COLUMN calificada_por,
  DROP COLUMN calificacion_revision;

COMMIT;
