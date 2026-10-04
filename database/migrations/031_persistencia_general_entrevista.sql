BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_entrevistas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expediente_id UUID NOT NULL,
  integrante_id UUID NOT NULL,

  conoce_asesora BOOLEAN,
  como_conocio_asesora VARCHAR(40),
  conoce_integrantes BOOLEAN,
  tiempo_conoce_integrantes VARCHAR(20),
  sabe_montos_companeras BOOLEAN,
  acuerdo_montos_companeras BOOLEAN,
  conoce_tesorera BOOLEAN,
  tesorera_reconocida_integrante_id UUID,
  domicilio_recoleccion_integrante_id UUID,
  desconoce_domicilio_recoleccion BOOLEAN,
  tiene_familiares_grupo BOOLEAN,

  tiene_otro_credito_grupal BOOLEAN,
  financiera_credito_grupal VARCHAR(100),
  credito_grupal_anterior_activo BOOLEAN,
  valor_ficha_credito_grupal NUMERIC(12, 2),
  semana_actual_credito_grupal SMALLINT,
  mes_desembolso_credito_grupal SMALLINT,
  mes_ultimo_pago_credito_grupal SMALLINT,
  anio_ultimo_pago_credito_grupal SMALLINT,
  numero_ciclos_credito_grupal SMALLINT,
  tasa_credito_grupal SMALLINT,
  nombre_asesora_credito_grupal VARCHAR(200),
  telefono_asesora_credito_grupal VARCHAR(10),
  motivo_no_renovacion_credito_grupal VARCHAR(120),

  vive_en_domicilio BOOLEAN,
  motivo_no_vive_domicilio VARCHAR(120),
  tipo_domicilio VARCHAR(20),
  familiar_domicilio VARCHAR(30),
  antiguedad_domicilio VARCHAR(20),
  personas_viven_casa VARCHAR(10),
  convivientes VARCHAR(20)[] NOT NULL DEFAULT '{}',
  saben_del_credito BOOLEAN,
  otro_ingreso_hogar BOOLEAN,
  otro_ingreso_semanal NUMERIC(12, 2),
  capacidad_pago_semanal NUMERIC(12, 2),
  uso_credito TEXT,
  fuentes_ingreso VARCHAR(20)[] NOT NULL DEFAULT '{}',
  sueldo_semanal NUMERIC(12, 2),
  lugar_trabajo VARCHAR(250),
  antiguedad_laboral VARCHAR(20),
  tipo_negocio VARCHAR(250),
  ingreso_libre_semanal_negocio NUMERIC(12, 2),
  ubicacion_negocio TEXT,

  tiene_control_pagos BOOLEAN,
  motivo_sin_control_pagos VARCHAR(120),
  asesora_acudio_semanalmente VARCHAR(20),
  firmaban_control_semanalmente VARCHAR(20),
  trato_asesora_tesorera VARCHAR(20),
  conoce_premio_tesorera BOOLEAN,

  opinion_credito VARCHAR(20),
  trato_desembolso VARCHAR(20),
  rapidez_desembolso VARCHAR(20),
  informacion_credito_clara BOOLEAN,
  recomendaria BOOLEAN,
  motivo_recomendacion VARCHAR(120),
  oportunidad_mejora TEXT,

  entrevistada_por UUID NOT NULL,
  actualizada_por UUID NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT verificacion_entrevistas_integrante_unica
    UNIQUE (integrante_id),
  CONSTRAINT verificacion_entrevistas_id_expediente_unico
    UNIQUE (id, expediente_id),
  CONSTRAINT verificacion_entrevistas_integrante_fkey
    FOREIGN KEY (expediente_id, integrante_id)
    REFERENCES integrantes(expediente_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevistas_tesorera_reconocida_fkey
    FOREIGN KEY (expediente_id, tesorera_reconocida_integrante_id)
    REFERENCES integrantes(expediente_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevistas_domicilio_recoleccion_fkey
    FOREIGN KEY (expediente_id, domicilio_recoleccion_integrante_id)
    REFERENCES integrantes(expediente_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevistas_entrevistada_por_fkey
    FOREIGN KEY (entrevistada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevistas_actualizada_por_fkey
    FOREIGN KEY (actualizada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevistas_revision_check
    CHECK (revision > 0),
  CONSTRAINT verificacion_entrevistas_importes_check
    CHECK (
      (valor_ficha_credito_grupal IS NULL OR valor_ficha_credito_grupal >= 0)
      AND (otro_ingreso_semanal IS NULL OR otro_ingreso_semanal >= 0)
      AND (capacidad_pago_semanal IS NULL OR capacidad_pago_semanal >= 0)
      AND (sueldo_semanal IS NULL OR sueldo_semanal >= 0)
      AND (ingreso_libre_semanal_negocio IS NULL OR ingreso_libre_semanal_negocio >= 0)
    ),
  CONSTRAINT verificacion_entrevistas_credito_externo_rangos_check
    CHECK (
      (semana_actual_credito_grupal IS NULL OR semana_actual_credito_grupal BETWEEN 1 AND 16)
      AND (mes_desembolso_credito_grupal IS NULL OR mes_desembolso_credito_grupal BETWEEN 1 AND 12)
      AND (mes_ultimo_pago_credito_grupal IS NULL OR mes_ultimo_pago_credito_grupal BETWEEN 1 AND 12)
      AND (anio_ultimo_pago_credito_grupal IS NULL OR anio_ultimo_pago_credito_grupal BETWEEN 1900 AND 2200)
      AND (numero_ciclos_credito_grupal IS NULL OR numero_ciclos_credito_grupal BETWEEN 1 AND 40)
      AND (tasa_credito_grupal IS NULL OR tasa_credito_grupal BETWEEN 65 AND 100)
    ),
  CONSTRAINT verificacion_entrevistas_telefono_asesora_check
    CHECK (telefono_asesora_credito_grupal IS NULL OR telefono_asesora_credito_grupal ~ '^[0-9]{10}$'),
  CONSTRAINT verificacion_entrevistas_fuentes_ingreso_check
    CHECK (fuentes_ingreso <@ ARRAY['SUELDO', 'NEGOCIO']::VARCHAR[]),
  CONSTRAINT verificacion_entrevistas_convivientes_check
    CHECK (convivientes <@ ARRAY['CONYUGE', 'HIJOS', 'PADRES', 'HERMANOS', 'OTROS']::VARCHAR[]),
  CONSTRAINT verificacion_entrevistas_tesorera_consistencia_check
    CHECK (
      conoce_tesorera IS DISTINCT FROM FALSE
      OR tesorera_reconocida_integrante_id IS NULL
    ),
  CONSTRAINT verificacion_entrevistas_domicilio_recoleccion_check
    CHECK (NOT (
      domicilio_recoleccion_integrante_id IS NOT NULL
      AND desconoce_domicilio_recoleccion IS TRUE
    )),
  CONSTRAINT verificacion_entrevistas_condicionales_check
    CHECK (
      (conoce_asesora IS DISTINCT FROM FALSE OR como_conocio_asesora IS NULL)
      AND (conoce_integrantes IS DISTINCT FROM FALSE OR tiempo_conoce_integrantes IS NULL)
      AND (tiene_otro_credito_grupal IS DISTINCT FROM FALSE OR (
        financiera_credito_grupal IS NULL
        AND credito_grupal_anterior_activo IS NULL
        AND valor_ficha_credito_grupal IS NULL
        AND semana_actual_credito_grupal IS NULL
        AND mes_desembolso_credito_grupal IS NULL
        AND mes_ultimo_pago_credito_grupal IS NULL
        AND anio_ultimo_pago_credito_grupal IS NULL
        AND numero_ciclos_credito_grupal IS NULL
        AND tasa_credito_grupal IS NULL
        AND nombre_asesora_credito_grupal IS NULL
        AND telefono_asesora_credito_grupal IS NULL
        AND motivo_no_renovacion_credito_grupal IS NULL
      ))
      AND (vive_en_domicilio IS DISTINCT FROM TRUE OR motivo_no_vive_domicilio IS NULL)
      AND (tipo_domicilio = 'FAMILIAR' OR familiar_domicilio IS NULL)
      AND (otro_ingreso_hogar IS DISTINCT FROM FALSE OR otro_ingreso_semanal IS NULL)
      AND ('SUELDO' = ANY(fuentes_ingreso) OR (
        sueldo_semanal IS NULL AND lugar_trabajo IS NULL AND antiguedad_laboral IS NULL
      ))
      AND ('NEGOCIO' = ANY(fuentes_ingreso) OR (
        tipo_negocio IS NULL
        AND ingreso_libre_semanal_negocio IS NULL
        AND ubicacion_negocio IS NULL
      ))
      AND (tiene_control_pagos IS DISTINCT FROM TRUE OR motivo_sin_control_pagos IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS ix_verificacion_entrevistas_expediente
  ON verificacion_entrevistas(expediente_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS verificacion_entrevista_familiares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entrevista_id UUID NOT NULL,
  expediente_id UUID NOT NULL,
  familiar_integrante_id UUID NOT NULL,
  activo BOOLEAN NOT NULL,
  registrada_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_entrevista_familiares_entrevista_fkey
    FOREIGN KEY (entrevista_id, expediente_id)
    REFERENCES verificacion_entrevistas(id, expediente_id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_familiares_integrante_fkey
    FOREIGN KEY (expediente_id, familiar_integrante_id)
    REFERENCES integrantes(expediente_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_familiares_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_verificacion_entrevista_familiares_integrante
  ON verificacion_entrevista_familiares(entrevista_id, familiar_integrante_id, created_at DESC);

CREATE TABLE IF NOT EXISTS verificacion_entrevista_desacuerdos_montos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entrevista_id UUID NOT NULL,
  expediente_id UUID NOT NULL,
  integrante_objetivo_id UUID NOT NULL,
  motivo VARCHAR(120),
  activo BOOLEAN NOT NULL,
  registrada_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_entrevista_desacuerdos_entrevista_fkey
    FOREIGN KEY (entrevista_id, expediente_id)
    REFERENCES verificacion_entrevistas(id, expediente_id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_desacuerdos_integrante_fkey
    FOREIGN KEY (expediente_id, integrante_objetivo_id)
    REFERENCES integrantes(expediente_id, id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_desacuerdos_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_entrevista_desacuerdos_motivo_check
    CHECK (
      (activo = TRUE AND NULLIF(BTRIM(motivo), '') IS NOT NULL)
      OR (activo = FALSE AND motivo IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS ix_verificacion_entrevista_desacuerdos_integrante
  ON verificacion_entrevista_desacuerdos_montos(entrevista_id, integrante_objetivo_id, created_at DESC);

ALTER TABLE verificacion_entrevista_negocio_evidencias
  RENAME TO verificacion_entrevista_evidencias;

ALTER TABLE verificacion_entrevista_evidencias
  RENAME COLUMN origen TO captura_fuente;

ALTER TABLE verificacion_entrevista_evidencias
  ADD COLUMN tipo VARCHAR(40) NOT NULL DEFAULT 'NEGOCIO',
  ADD COLUMN foto_capturada_at TIMESTAMPTZ,
  ADD COLUMN ubicacion_latitud NUMERIC(10, 7),
  ADD COLUMN ubicacion_longitud NUMERIC(11, 7),
  ADD COLUMN ubicacion_precision_metros NUMERIC(10, 2),
  ADD COLUMN ubicacion_capturada_at TIMESTAMPTZ,
  ADD COLUMN ubicacion_fuente VARCHAR(20),
  ADD COLUMN legado_sin_ubicacion BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE verificacion_entrevista_evidencias
SET legado_sin_ubicacion = TRUE;

ALTER TABLE verificacion_entrevista_evidencias
  ALTER COLUMN legado_sin_ubicacion SET DEFAULT FALSE,
  DROP CONSTRAINT IF EXISTS verificacion_entrevista_negocio_origen_check,
  ADD CONSTRAINT verificacion_entrevista_evidencias_tipo_check
    CHECK (tipo IN ('NEGOCIO', 'CONTROL_PAGOS', 'FOLLETO_PREMIO_TESORERA')),
  ADD CONSTRAINT verificacion_entrevista_evidencias_fuente_check
    CHECK (captura_fuente IN ('GALERIA', 'CAMARA')),
  ADD CONSTRAINT verificacion_entrevista_evidencias_ubicacion_check
    CHECK (
      legado_sin_ubicacion = TRUE
      OR (
        captura_fuente = 'CAMARA'
        AND foto_capturada_at IS NOT NULL
        AND ubicacion_latitud BETWEEN -90 AND 90
        AND ubicacion_longitud BETWEEN -180 AND 180
        AND (ubicacion_precision_metros IS NULL OR ubicacion_precision_metros >= 0)
        AND ubicacion_capturada_at IS NOT NULL
        AND ubicacion_fuente = 'DISPOSITIVO'
      )
    );

ALTER INDEX IF EXISTS ux_verificacion_entrevista_negocio_actor_idempotencia
  RENAME TO ux_verificacion_entrevista_evidencia_actor_idempotencia;

ALTER INDEX IF EXISTS ix_verificacion_entrevista_negocio_integrante_fecha
  RENAME TO ix_verificacion_entrevista_evidencia_integrante_fecha;

COMMENT ON TABLE verificacion_entrevistas IS
  'Captura parcial autoguardada de la Entrevista de Verificacion; una fila por integrante y expediente.';
COMMENT ON COLUMN verificacion_entrevistas.entrevistada_por IS
  'Usuario autenticado que inicio la entrevista; nunca se acepta desde el cliente.';
COMMENT ON COLUMN verificacion_entrevistas.actualizada_por IS
  'Ultimo usuario autenticado que modifico respuestas de la entrevista.';
COMMENT ON COLUMN verificacion_entrevistas.revision IS
  'Revision monotona incrementada por el servidor en cada guardado confirmado.';
COMMENT ON TABLE verificacion_entrevista_familiares IS
  'Historial inmutable de altas y retiros de integrantes declaradas como familiares de la entrevistada.';
COMMENT ON TABLE verificacion_entrevista_desacuerdos_montos IS
  'Historial inmutable de integrantes cuyo monto no acepta la entrevistada, con una causa individual.';
COMMENT ON TABLE verificacion_entrevista_evidencias IS
  'Historial de fotografias propias de Entrevista, con actor, fecha, hash, idempotencia y ubicacion por captura nueva.';
COMMENT ON COLUMN verificacion_entrevista_evidencias.legado_sin_ubicacion IS
  'Marca exclusivamente filas anteriores a esta migracion cuya ubicacion no puede reconstruirse sin inventar datos.';

COMMIT;
