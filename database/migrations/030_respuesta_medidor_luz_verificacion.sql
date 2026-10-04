BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_medidor_luz_respuestas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integrante_id UUID NOT NULL,
  fachada_id UUID NOT NULL,
  tiene_medidor BOOLEAN NOT NULL,
  motivo VARCHAR(50),
  idempotency_key VARCHAR(100) NOT NULL,
  registrada_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_medidor_luz_respuestas_integrante_fkey
    FOREIGN KEY (integrante_id)
    REFERENCES integrantes(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_medidor_luz_respuestas_fachada_fkey
    FOREIGN KEY (fachada_id)
    REFERENCES verificacion_imagenes_domicilio(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_medidor_luz_respuestas_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_medidor_luz_respuestas_idempotencia_check
    CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 16 AND 100),
  CONSTRAINT verificacion_medidor_luz_respuestas_motivo_check
    CHECK (
      (tiene_medidor = TRUE AND motivo IS NULL)
      OR
      (
        tiene_medidor = FALSE
        AND motivo IN (
          'SIN_SERVICIO_ELECTRICO',
          'SERVICIO_COMPARTIDO',
          'MEDIDOR_EN_OTRO_DOMICILIO',
          'MEDIDOR_RETIRADO_O_PENDIENTE',
          'UBICACION_DESCONOCIDA'
        )
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_verificacion_medidor_luz_actor_idempotencia
  ON verificacion_medidor_luz_respuestas(registrada_por, idempotency_key);

CREATE INDEX IF NOT EXISTS ix_verificacion_medidor_luz_integrante_fecha
  ON verificacion_medidor_luz_respuestas(integrante_id, created_at DESC);

COMMENT ON TABLE verificacion_medidor_luz_respuestas IS
  'Historial de respuestas sobre la existencia del medidor de luz para la fachada vigente en Verificacion.';
COMMENT ON COLUMN verificacion_medidor_luz_respuestas.fachada_id IS
  'Fachada vigente a la que corresponde la respuesta; la API valida integrante y actualidad.';
COMMENT ON COLUMN verificacion_medidor_luz_respuestas.motivo IS
  'Causa controlada y obligatoria cuando el domicilio no tiene medidor de luz.';
COMMENT ON COLUMN verificacion_medidor_luz_respuestas.idempotency_key IS
  'Clave estable para evitar duplicados ante reintentos de red.';

COMMIT;
