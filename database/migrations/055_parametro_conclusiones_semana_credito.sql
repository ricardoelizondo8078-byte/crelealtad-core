BEGIN;

CREATE TABLE public.parametros_conclusiones_semana_credito (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  verde_desde SMALLINT NOT NULL,
  verde_hasta SMALLINT NOT NULL,
  amarillo_desde SMALLINT NOT NULL,
  amarillo_hasta SMALLINT NOT NULL,
  rojo_desde SMALLINT NOT NULL,
  rojo_hasta SMALLINT NOT NULL,
  updated_by UUID NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_parametros_conclusiones_semana_unica CHECK (id = 1),
  CONSTRAINT chk_parametros_conclusiones_semana_limites CHECK (
    verde_desde BETWEEN 1 AND 16
    AND verde_hasta BETWEEN 1 AND 16
    AND amarillo_desde BETWEEN 1 AND 16
    AND amarillo_hasta BETWEEN 1 AND 16
    AND rojo_desde BETWEEN 1 AND 16
    AND rojo_hasta BETWEEN 1 AND 16
  ),
  CONSTRAINT chk_parametros_conclusiones_semana_particion CHECK (
    verde_desde = 1
    AND verde_desde <= verde_hasta
    AND amarillo_desde = verde_hasta + 1
    AND amarillo_desde <= amarillo_hasta
    AND rojo_desde = amarillo_hasta + 1
    AND rojo_desde <= rojo_hasta
    AND rojo_hasta = 16
  )
);

INSERT INTO public.parametros_conclusiones_semana_credito (
  id,
  verde_desde,
  verde_hasta,
  amarillo_desde,
  amarillo_hasta,
  rojo_desde,
  rojo_hasta
)
VALUES (1, 1, 10, 11, 13, 14, 16);

COMMIT;
