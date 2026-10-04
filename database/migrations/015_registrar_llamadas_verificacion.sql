BEGIN;

CREATE TABLE IF NOT EXISTS verificacion_llamadas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integrante_id UUID NOT NULL,
  canal VARCHAR(20) NOT NULL,
  resultado VARCHAR(20) NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  registrada_por UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT verificacion_llamadas_integrante_fkey
    FOREIGN KEY (integrante_id)
    REFERENCES integrantes(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_llamadas_usuario_fkey
    FOREIGN KEY (registrada_por)
    REFERENCES usuarios(id)
    ON DELETE RESTRICT,
  CONSTRAINT verificacion_llamadas_canal_check
    CHECK (canal IN ('TELEFONICA', 'WHATSAPP')),
  CONSTRAINT verificacion_llamadas_resultado_check
    CHECK (resultado IN ('CONTESTADA', 'NO_CONTESTADA')),
  CONSTRAINT verificacion_llamadas_idempotencia_check
    CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 16 AND 100)
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_verificacion_llamadas_actor_idempotencia
  ON verificacion_llamadas(registrada_por, idempotency_key);

CREATE INDEX IF NOT EXISTS ix_verificacion_llamadas_integrante_fecha
  ON verificacion_llamadas(integrante_id, created_at DESC);

COMMENT ON TABLE verificacion_llamadas IS
  'Intentos de llamada declarados por el verificador durante la verificacion individual.';
COMMENT ON COLUMN verificacion_llamadas.canal IS
  'Canal utilizado: TELEFONICA o WHATSAPP.';
COMMENT ON COLUMN verificacion_llamadas.resultado IS
  'Resultado declarado: CONTESTADA o NO_CONTESTADA.';
COMMENT ON COLUMN verificacion_llamadas.idempotency_key IS
  'Clave estable del intento para evitar duplicados ante reintentos de red.';

WITH permisos_objetivo AS (
  SELECT
    id,
    permisos AS permisos_antes,
    JSONB_SET(
      COALESCE(permisos, '{"modulos":[],"acciones":[]}'::JSONB),
      '{acciones}',
      COALESCE(permisos -> 'acciones', '[]'::JSONB) || '["registrar"]'::JSONB,
      TRUE
    ) AS permisos_despues
  FROM roles
  WHERE nombre IN ('ASESOR', 'VERIFICADOR')
    AND NOT COALESCE(permisos, '{}'::JSONB) @> '{"acciones":["registrar"]}'::JSONB
), roles_actualizados AS (
  UPDATE roles AS rol
  SET permisos = objetivo.permisos_despues,
      updated_at = NOW()
  FROM permisos_objetivo AS objetivo
  WHERE rol.id = objetivo.id
  RETURNING rol.id, objetivo.permisos_antes, rol.permisos AS permisos_despues
)
INSERT INTO audit_log (
  tabla,
  registro_id,
  accion,
  datos_antes,
  datos_despues,
  usuario_id
)
SELECT
  'roles',
  id,
  'PERMISO_REG_LLAMADA',
  JSONB_BUILD_OBJECT('permisos', permisos_antes),
  JSONB_BUILD_OBJECT(
    'permisos', permisos_despues,
    'motivo', 'Registrar intentos de llamada en Verificacion'
  ),
  NULL
FROM roles_actualizados;

COMMIT;
