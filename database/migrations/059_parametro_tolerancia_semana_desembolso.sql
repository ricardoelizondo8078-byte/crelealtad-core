BEGIN;

CREATE TABLE public.parametros_conclusiones_tolerancia_semana_desembolso (
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
  CONSTRAINT uq_parametros_conclusiones_tolerancia_desembolso_audit_id UNIQUE (audit_id),
  CONSTRAINT chk_parametros_conclusiones_tolerancia_desembolso_unico CHECK (id = 1),
  CONSTRAINT chk_parametros_conclusiones_tolerancia_desembolso_limites CHECK (
    verde_desde BETWEEN 0 AND 10
    AND verde_hasta BETWEEN 0 AND 10
    AND amarillo_desde BETWEEN 0 AND 10
    AND amarillo_hasta BETWEEN 0 AND 10
    AND rojo_desde BETWEEN 0 AND 10
    AND rojo_hasta BETWEEN 0 AND 10
  ),
  CONSTRAINT chk_parametros_conclusiones_tolerancia_desembolso_sin_traslapes CHECK (
    verde_desde <= verde_hasta
    AND amarillo_desde <= amarillo_hasta
    AND rojo_desde <= rojo_hasta
    AND (verde_hasta < amarillo_desde OR amarillo_hasta < verde_desde)
    AND (verde_hasta < rojo_desde OR rojo_hasta < verde_desde)
    AND (amarillo_hasta < rojo_desde OR rojo_hasta < amarillo_desde)
  )
);

INSERT INTO public.parametros_conclusiones_tolerancia_semana_desembolso (
  id, verde_desde, verde_hasta, amarillo_desde, amarillo_hasta, rojo_desde, rojo_hasta
)
VALUES (1, 0, 0, 1, 3, 4, 10);

COMMIT;
