BEGIN;

DO $$
DECLARE
  v_rol_id UUID;
  v_permisos_antes JSONB;
  v_permisos_base JSONB;
  v_permisos_despues JSONB;
  v_modulos JSONB;
  v_acciones JSONB;
BEGIN
  SELECT id, permisos
  INTO v_rol_id, v_permisos_antes
  FROM roles
  WHERE UPPER(nombre) = 'ASESOR'
    AND estado = 'ACTIVO'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Se requiere exactamente un rol ASESOR activo';
  END IF;

  v_permisos_base := COALESCE(v_permisos_antes, '{}'::JSONB);

  SELECT JSONB_AGG(valor ORDER BY valor)
  INTO v_modulos
  FROM (
    SELECT DISTINCT valor
    FROM JSONB_ARRAY_ELEMENTS_TEXT(
      CASE
        WHEN JSONB_TYPEOF(v_permisos_base -> 'modulos') = 'array'
          THEN v_permisos_base -> 'modulos'
        ELSE '[]'::JSONB
      END
    ) AS modulo(valor)
    UNION
    SELECT 'verificacion'
  ) AS modulos;

  SELECT JSONB_AGG(valor ORDER BY valor)
  INTO v_acciones
  FROM (
    SELECT DISTINCT valor
    FROM JSONB_ARRAY_ELEMENTS_TEXT(
      CASE
        WHEN JSONB_TYPEOF(v_permisos_base -> 'acciones') = 'array'
          THEN v_permisos_base -> 'acciones'
        ELSE '[]'::JSONB
      END
    ) AS accion(valor)
    UNION
    SELECT 'leer'
  ) AS acciones;

  v_permisos_despues := JSONB_SET(
    JSONB_SET(v_permisos_base, '{modulos}', v_modulos, TRUE),
    '{acciones}',
    v_acciones,
    TRUE
  );

  IF v_permisos_despues IS DISTINCT FROM v_permisos_antes THEN
    UPDATE roles
    SET permisos = v_permisos_despues,
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
      'PERMISOS_VERIF_TMP',
      JSONB_BUILD_OBJECT(
        'permisos', v_permisos_antes,
        'decision', 'DEC-023'
      ),
      JSONB_BUILD_OBJECT(
        'permisos', v_permisos_despues,
        'decision', 'DEC-023',
        'motivo', 'Acceso temporal de asesores a los modulos ejecutables'
      ),
      NULL,
      NULL
    );
  END IF;
END
$$;

COMMIT;
