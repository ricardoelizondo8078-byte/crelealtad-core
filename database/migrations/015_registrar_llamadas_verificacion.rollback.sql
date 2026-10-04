BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM verificacion_llamadas) THEN
    RAISE EXCEPTION 'No se puede revertir: existen llamadas de verificacion que deben conservarse como historial';
  END IF;
END
$$;

WITH permisos_objetivo AS (
  SELECT
    id,
    permisos AS permisos_antes,
    JSONB_SET(
      permisos,
      '{acciones}',
      COALESCE((
        SELECT JSONB_AGG(accion ORDER BY accion)
        FROM JSONB_ARRAY_ELEMENTS_TEXT(permisos -> 'acciones') AS acciones(accion)
        WHERE accion <> 'registrar'
      ), '[]'::JSONB),
      TRUE
    ) AS permisos_despues
  FROM roles
  WHERE nombre IN ('ASESOR', 'VERIFICADOR')
    AND COALESCE(permisos, '{}'::JSONB) @> '{"acciones":["registrar"]}'::JSONB
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
  'REV_PERM_REG_LLAM',
  JSONB_BUILD_OBJECT('permisos', permisos_antes),
  JSONB_BUILD_OBJECT(
    'permisos', permisos_despues,
    'motivo', 'Reversion de persistencia de llamadas de Verificacion'
  ),
  NULL
FROM roles_actualizados;

DROP TABLE IF EXISTS verificacion_llamadas;

COMMIT;
