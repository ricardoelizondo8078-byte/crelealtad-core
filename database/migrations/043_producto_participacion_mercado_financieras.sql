BEGIN;

ALTER TABLE public.financieras_competidoras_versiones
  ADD COLUMN semanas VARCHAR(120),
  ADD COLUMN tasa VARCHAR(120),
  ADD COLUMN seguro VARCHAR(120),
  ADD COLUMN apertura VARCHAR(120),
  ADD COLUMN retencion VARCHAR(120),
  ADD COLUMN base VARCHAR(120),
  ADD COLUMN refinanciamiento VARCHAR(120);

CREATE TABLE public.financieras_competidoras_sucursales_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL,
  orden SMALLINT NOT NULL,
  zona VARCHAR(120),
  direccion VARCHAR(250),
  numero_asesoras INTEGER,
  valor_sucursal VARCHAR(120),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_financieras_sucursales_version
    FOREIGN KEY (version_id)
    REFERENCES public.financieras_competidoras_versiones(id)
    ON DELETE RESTRICT,
  CONSTRAINT uq_financieras_sucursales_version_orden
    UNIQUE (version_id, orden),
  CONSTRAINT ck_financieras_sucursales_version_orden
    CHECK (orden BETWEEN 1 AND 100),
  CONSTRAINT ck_financieras_sucursales_numero_asesoras
    CHECK (numero_asesoras IS NULL OR numero_asesoras >= 0),
  CONSTRAINT ck_financieras_sucursales_zona
    CHECK (zona IS NULL OR BTRIM(zona) <> ''),
  CONSTRAINT ck_financieras_sucursales_direccion
    CHECK (direccion IS NULL OR BTRIM(direccion) <> ''),
  CONSTRAINT ck_financieras_sucursales_valor
    CHECK (valor_sucursal IS NULL OR BTRIM(valor_sucursal) <> '')
);

CREATE INDEX idx_financieras_sucursales_version
  ON public.financieras_competidoras_sucursales_version(version_id, orden);

COMMENT ON COLUMN public.financieras_competidoras_versiones.semanas IS
  'Dato descriptivo versionado sobre las semanas del producto de la financiera.';
COMMENT ON COLUMN public.financieras_competidoras_versiones.tasa IS
  'Dato descriptivo versionado sobre la tasa del producto de la financiera.';
COMMENT ON COLUMN public.financieras_competidoras_versiones.seguro IS
  'Dato descriptivo versionado sobre el seguro del producto de la financiera.';
COMMENT ON COLUMN public.financieras_competidoras_versiones.apertura IS
  'Dato descriptivo versionado sobre la apertura del producto de la financiera.';
COMMENT ON COLUMN public.financieras_competidoras_versiones.retencion IS
  'Dato descriptivo versionado sobre la retención del producto de la financiera.';
COMMENT ON COLUMN public.financieras_competidoras_versiones.base IS
  'Dato descriptivo versionado sobre la base del producto de la financiera.';
COMMENT ON COLUMN public.financieras_competidoras_versiones.refinanciamiento IS
  'Dato descriptivo versionado sobre el refinanciamiento del producto de la financiera.';
COMMENT ON TABLE public.financieras_competidoras_sucursales_version IS
  'Sucursales declaradas dentro de una versión inmutable de una financiera competidora.';

COMMIT;
