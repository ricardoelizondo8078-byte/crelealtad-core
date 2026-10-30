BEGIN;

ALTER TABLE public.verificacion_entrevista_evidencia_integrantes
  ADD COLUMN calificacion_revision VARCHAR(10) NULL,
  ADD COLUMN calificada_por UUID NULL,
  ADD COLUMN calificada_at TIMESTAMPTZ NULL,
  ADD CONSTRAINT chk_ver_ent_evid_int_calificacion
    CHECK (calificacion_revision IS NULL OR calificacion_revision IN ('TACHA', 'PALOMITA')),
  ADD CONSTRAINT chk_ver_ent_evid_int_calificacion_actor
    CHECK (
      (calificacion_revision IS NULL AND calificada_por IS NULL AND calificada_at IS NULL)
      OR
      (calificacion_revision IS NOT NULL AND calificada_por IS NOT NULL AND calificada_at IS NOT NULL)
    ),
  ADD CONSTRAINT fk_ver_ent_evid_int_calificada_por
    FOREIGN KEY (calificada_por) REFERENCES public.usuarios(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.verificacion_entrevista_evidencia_integrantes.calificacion_revision
  IS 'Calificación independiente de la evidencia para esta integrante: TACHA o PALOMITA.';
COMMENT ON COLUMN public.verificacion_entrevista_evidencia_integrantes.calificada_por
  IS 'Usuario que emitió la calificación vigente de la evidencia para esta integrante.';
COMMENT ON COLUMN public.verificacion_entrevista_evidencia_integrantes.calificada_at
  IS 'Fecha y hora de la calificación vigente de la evidencia para esta integrante.';

COMMIT;
