BEGIN;

DO $$
DECLARE
  v_rol_id UUID;
  v_permisos_actuales JSONB;
  v_permisos_antes JSONB;
  v_permisos_despues JSONB;
  v_auditoria RECORD;
BEGIN
  SELECT id, permisos
  INTO v_rol_id, v_permisos_actuales
  FROM roles
  WHERE UPPER(nombre) = 'ASESOR'
    AND estado = 'ACTIVO'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Se requiere exactamente un rol ASESOR activo';
  END IF;

  SELECT datos_antes, datos_despues
  INTO v_auditoria
  FROM audit_log
  WHERE tabla = 'roles'
    AND registro_id = v_rol_id
    AND accion = 'PERMISOS_VERIF_TMP'
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe una auditoria aplicable para revertir DEC-023';
  END IF;

  v_permisos_antes := v_auditoria.datos_antes -> 'permisos';
  v_permisos_despues := v_auditoria.datos_despues -> 'permisos';

  IF v_permisos_actuales IS DISTINCT FROM v_permisos_despues THEN
    RAISE EXCEPTION 'Los permisos ASESOR cambiaron despues de DEC-023; se requiere revision manual';
  END IF;

  IF v_permisos_antes = 'null'::JSONB THEN
    v_permisos_antes := NULL;
  END IF;

  UPDATE roles
  SET permisos = v_permisos_antes,
      updated_at = NOW()
  WHERE id = v_rol_id;

  INSERT INTO audit_log (
    tabla,
    registro_id,
    accion,
    datos_antes,
    datos_despues,
    usuario_id,
    ip_address
  ) VALUES (
    'roles',
    v_rol_id,
    'ROLLBACK_VERIF_TMP',
    JSONB_BUILD_OBJECT(
      'permisos', v_permisos_actuales,
      'decision', 'DEC-023'
    ),
    JSONB_BUILD_OBJECT(
      'permisos', v_permisos_antes,
      'decision', 'DEC-023'
    ),
    NULL,
    NULL
  );
END
$$;

COMMIT;
