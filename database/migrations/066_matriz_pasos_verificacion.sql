BEGIN;

CREATE TABLE public.parametros_verificacion_pasos_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  revision INTEGER NOT NULL UNIQUE,
  publicada_por UUID NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
  publicada_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_parametros_verificacion_pasos_revision CHECK (revision > 0)
);

CREATE TABLE public.parametros_verificacion_pasos_reglas (
  version_id UUID NOT NULL REFERENCES public.parametros_verificacion_pasos_versiones(id) ON DELETE RESTRICT,
  tipo_integrante VARCHAR(40) NOT NULL,
  paso VARCHAR(40) NOT NULL,
  obligatorio BOOLEAN NOT NULL,
  PRIMARY KEY (version_id, tipo_integrante, paso),
  CONSTRAINT chk_parametros_verificacion_tipo_integrante CHECK (
    tipo_integrante IN (
      'NUEVA',
      'NUEVA_CON_EVIDENCIA',
      'CICLO_2_MAS',
      'CICLO_2_MAS_CON_EVIDENCIA'
    )
  ),
  CONSTRAINT chk_parametros_verificacion_paso CHECK (
    paso IN (
      'DOCUMENTOS',
      'LLAMADA',
      'VISITA_VECINO',
      'IMAGENES_DOMICILIO',
      'ENTREVISTA',
      'CONCLUSIONES'
    )
  )
);

COMMENT ON TABLE public.parametros_verificacion_pasos_versiones IS
  'Versiones inmutables publicadas de la obligatoriedad de procesos de Verificacion.';
COMMENT ON TABLE public.parametros_verificacion_pasos_reglas IS
  'Matriz de obligatoriedad por tipo de integrante y proceso, sin imponer orden de ejecucion.';

WITH version_inicial AS (
  INSERT INTO public.parametros_verificacion_pasos_versiones (revision)
  VALUES (1)
  RETURNING id
), tipos(tipo_integrante) AS (
  VALUES
    ('NUEVA'),
    ('NUEVA_CON_EVIDENCIA'),
    ('CICLO_2_MAS'),
    ('CICLO_2_MAS_CON_EVIDENCIA')
), pasos(paso) AS (
  VALUES
    ('DOCUMENTOS'),
    ('LLAMADA'),
    ('VISITA_VECINO'),
    ('IMAGENES_DOMICILIO'),
    ('ENTREVISTA'),
    ('CONCLUSIONES')
)
INSERT INTO public.parametros_verificacion_pasos_reglas (
  version_id,
  tipo_integrante,
  paso,
  obligatorio
)
SELECT version_inicial.id, tipos.tipo_integrante, pasos.paso, TRUE
FROM version_inicial
CROSS JOIN tipos
CROSS JOIN pasos;

COMMIT;
