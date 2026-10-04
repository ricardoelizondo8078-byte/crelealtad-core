BEGIN;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS permisos_personalizados JSONB;

COMMENT ON COLUMN usuarios.permisos_personalizados IS
  'Permisos efectivos opcionales del usuario; no cambian su rol operativo';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'usuarios'::REGCLASS
      AND conname = 'usuarios_permisos_personalizados_formato_check'
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT usuarios_permisos_personalizados_formato_check
      CHECK (
        permisos_personalizados IS NULL
        OR (
          JSONB_TYPEOF(permisos_personalizados) = 'object'
          AND JSONB_TYPEOF(permisos_personalizados -> 'modulos') = 'array'
          AND JSONB_TYPEOF(permisos_personalizados -> 'acciones') = 'array'
        )
      );
  END IF;
END
$$;

DO $$
DECLARE
  v_usuario_id UUID;
  v_rol_actual_id UUID;
  v_rol_actual_nombre VARCHAR(50);
  v_permisos_antes JSONB;
  v_rol_asesor_id UUID;
  v_permisos_asesor JSONB;
  v_permisos_objetivo JSONB;
  v_modulos_objetivo JSONB;
  v_rol_prueba_id UUID;
BEGIN
  SELECT u.id, u.rol_id, r.nombre, u.permisos_personalizados
  INTO v_usuario_id, v_rol_actual_id, v_rol_actual_nombre, v_permisos_antes
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id
  WHERE UPPER(u.abreviatura) = 'GPE_BARRON'
    AND u.estado = 'ACTIVO'
  FOR UPDATE OF u;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe una cuenta activa GPE_BARRON';
  END IF;

  SELECT id, permisos
  INTO v_rol_asesor_id, v_permisos_asesor
  FROM roles
  WHERE UPPER(nombre) = 'ASESOR'
    AND estado = 'ACTIVO'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe un rol ASESOR activo';
  END IF;

  IF JSONB_TYPEOF(v_permisos_asesor -> 'modulos') IS DISTINCT FROM 'array'
    OR JSONB_TYPEOF(v_permisos_asesor -> 'acciones') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'El rol ASESOR no tiene permisos validos';
  END IF;

  SELECT COALESCE(JSONB_AGG(modulo ORDER BY modulo), '[]'::JSONB)
  INTO v_modulos_objetivo
  FROM (
    SELECT DISTINCT modulo
    FROM JSONB_ARRAY_ELEMENTS_TEXT(v_permisos_asesor -> 'modulos') AS modulos(modulo)
    WHERE modulo <> 'verificacion'
  ) AS modulos_filtrados;

  v_permisos_objetivo := JSONB_SET(
    v_permisos_asesor,
    '{modulos}',
    v_modulos_objetivo,
    TRUE
  );

  IF v_rol_actual_nombre NOT IN ('ASESOR', 'ASESOR_PRUEBA_SIN_VERIFICACION') THEN
    RAISE EXCEPTION 'GPE_BARRON tiene el rol inesperado %', v_rol_actual_nombre;
  END IF;

  IF v_rol_actual_id IS DISTINCT FROM v_rol_asesor_id
    OR v_permisos_antes IS DISTINCT FROM v_permisos_objetivo THEN
    UPDATE usuarios
    SET rol_id = v_rol_asesor_id,
        permisos_personalizados = v_permisos_objetivo,
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
      'PERMISOS_USUARIO',
      JSONB_BUILD_OBJECT(
        'rol_id', v_rol_actual_id,
        'rol_nombre', v_rol_actual_nombre,
        'permisos_personalizados', v_permisos_antes
      ),
      JSONB_BUILD_OBJECT(
        'rol_id', v_rol_asesor_id,
        'rol_nombre', 'ASESOR',
        'permisos_personalizados', v_permisos_objetivo,
        'motivo', 'Restringir Verificacion sin cambiar el rol operativo del usuario',
        'ejecutado_por', 'Codex'
      ),
      NULL,
      NULL
    );
  END IF;

  SELECT id
  INTO v_rol_prueba_id
  FROM roles
  WHERE UPPER(nombre) = 'ASESOR_PRUEBA_SIN_VERIFICACION'
  FOR UPDATE;

  IF FOUND
    AND NOT EXISTS (SELECT 1 FROM usuarios WHERE rol_id = v_rol_prueba_id) THEN
    UPDATE roles
    SET estado = 'INACTIVO',
        updated_at = NOW()
    WHERE id = v_rol_prueba_id
      AND estado IS DISTINCT FROM 'INACTIVO';

    IF FOUND THEN
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
        v_rol_prueba_id,
        'ROL_PRUEBA_INACT',
        JSONB_BUILD_OBJECT('estado', 'ACTIVO'),
        JSONB_BUILD_OBJECT(
          'estado', 'INACTIVO',
          'motivo', 'El permiso individual ya no altera el rol operativo',
          'ejecutado_por', 'Codex'
        ),
        NULL,
        NULL
      );
    END IF;
  END IF;
END
$$;

COMMIT;
