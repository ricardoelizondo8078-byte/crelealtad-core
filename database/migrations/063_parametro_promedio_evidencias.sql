BEGIN;

CREATE TABLE public.parametros_conclusiones_promedio_evidencias (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  audit_id UUID NOT NULL DEFAULT gen_random_uuid(),
  verde_desde SMALLINT NOT NULL,
  verde_hasta SMALLINT NOT NULL,
  amarillo_desde SMALLINT NOT NULL,
  amarillo_hasta SMALLINT NOT NULL,
  rojo_desde SMALLINT NOT NULL,
  rojo_hasta SMALLINT NOT NULL,
  updated_by UUID NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_par_con_promedio_evidencias_audit UNIQUE (audit_id),
  CONSTRAINT chk_par_con_promedio_evidencias_unico CHECK (id = 1),
  CONSTRAINT chk_par_con_promedio_evidencias_limites CHECK (
    verde_desde BETWEEN 0 AND 100 AND verde_hasta BETWEEN 0 AND 100
    AND amarillo_desde BETWEEN 0 AND 100 AND amarillo_hasta BETWEEN 0 AND 100
    AND rojo_desde BETWEEN 0 AND 100 AND rojo_hasta BETWEEN 0 AND 100
  ),
  CONSTRAINT chk_par_con_promedio_evidencias_rangos CHECK (
    verde_desde <= verde_hasta
    AND amarillo_desde <= amarillo_hasta
    AND rojo_desde <= rojo_hasta
    AND (verde_hasta < amarillo_desde OR amarillo_hasta < verde_desde)
    AND (verde_hasta < rojo_desde OR rojo_hasta < verde_desde)
    AND (amarillo_hasta < rojo_desde OR rojo_hasta < amarillo_desde)
  )
);

INSERT INTO public.parametros_conclusiones_promedio_evidencias (
  id, verde_desde, verde_hasta, amarillo_desde, amarillo_hasta, rojo_desde, rojo_hasta
) VALUES (1, 67, 100, 34, 66, 0, 33);

COMMIT;
