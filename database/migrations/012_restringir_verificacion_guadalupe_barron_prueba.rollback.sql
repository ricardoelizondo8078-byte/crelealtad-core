BEGIN;

DO $$
DECLARE
  v_usuario_id UUID;
  v_rol_actual_nombre VARCHAR(50);
  v_permisos_actuales JSONB;
  v_usuarios_personalizados INTEGER;
BEGIN
  SELECT u.id, r.nombre, u.permisos_personalizados
  INTO v_usuario_id, v_rol_actual_nombre, v_permisos_actuales
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE UPPER(u.abreviatura) = 'GPE_BARRON'
  FOR UPDATE OF u;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe la cuenta GPE_BARRON';
  END IF;

  IF v_rol_actual_nombre <> 'ASESOR' THEN
    RAISE EXCEPTION 'GPE_BARRON ya no tiene rol ASESOR; no se revierte';
  END IF;

  IF v_permisos_actuales IS NOT NULL THEN
    UPDATE usuarios
    SET permisos_personalizados = NULL,
        updated_at = NOW()
    WHERE id = v_usuario_id;

    INSERT INTO audit_log (
      tabla,
      registro_id,
      accion,
      datos_antes,
      datos_despues,
      usuario_id,
      ip_address
    ) VALUES (
      'usuarios',
      v_usuario_id,
      'ROLLBACK_PERM_USR',
      JSONB_BUILD_OBJECT(
        'rol_nombre', 'ASESOR',
        'permisos_personalizados', v_permisos_actuales
      ),
      JSONB_BUILD_OBJECT(
        'rol_nombre', 'ASESOR',
        'permisos_personalizados', NULL,
        'motivo', 'Reversion de la restriccion individual de Verificacion',
        'ejecutado_por', 'Codex'
      ),
      NULL,
      NULL
    );
  END IF;

  SELECT COUNT(*)
  INTO v_usuarios_personalizados
  FROM usuarios
  WHERE permisos_personalizados IS NOT NULL;

  IF v_usuarios_personalizados <> 0 THEN
    RAISE EXCEPTION 'Existen otros usuarios con permisos personalizados; no se elimina la columna';
  END IF;
END
$$;

ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS usuarios_permisos_personalizados_formato_check;

ALTER TABLE usuarios
  DROP COLUMN IF EXISTS permisos_personalizados;

COMMIT;
