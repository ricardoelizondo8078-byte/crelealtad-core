BEGIN;

DO $$
DECLARE
  v_registro RECORD;
  v_permisos_base JSONB;
  v_capacidades JSONB;
  v_permisos_despues JSONB;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.financieras_competidoras_versiones
    WHERE estado IN ('PENDIENTE_APROBACION', 'APROBADA')
  ) THEN
    RAISE EXCEPTION
      'Existen propuestas abiertas de financieras; deben resolverse antes de habilitar la publicación directa';
  END IF;

  FOR v_registro IN
    SELECT id, UPPER(nombre) AS nombre, permisos
    FROM public.roles
    ORDER BY id
    FOR UPDATE
  LOOP
    v_permisos_base := COALESCE(
      v_registro.permisos,
      '{"modulos":[],"acciones":[]}'::JSONB
    );

    SELECT COALESCE(JSONB_AGG(valor ORDER BY valor), '[]'::JSONB)
    INTO v_capacidades
    FROM (
      SELECT DISTINCT valor
      FROM JSONB_ARRAY_ELEMENTS_TEXT(
        CASE
          WHEN JSONB_TYPEOF(v_permisos_base -> 'capacidades') = 'array'
            THEN v_permisos_base -> 'capacidades'
          ELSE '[]'::JSONB
        END
      ) AS capacidad(valor)
      WHERE valor NOT IN ('parametros:aprobar', 'parametros:rechazar')
      UNION
      SELECT UNNEST(ARRAY[
        'parametros:leer',
        'parametros:actualizar',
        'parametros:registrar'
      ])
      WHERE v_registro.nombre = 'ADMINISTRADOR'
    ) AS capacidades;

    v_permisos_despues := JSONB_SET(
      v_permisos_base,
      '{capacidades}',
      v_capacidades,
      TRUE
    );

    IF v_permisos_despues IS DISTINCT FROM v_registro.permisos THEN
      UPDATE public.roles
      SET permisos = v_permisos_despues,
          updated_at = NOW()
      WHERE id = v_registro.id;

      INSERT INTO public.audit_log (
        tabla, registro_id, accion, datos_antes, datos_despues, usuario_id, ip_address
      ) VALUES (
        'roles',
        v_registro.id,
        'PARAM_ADMIN_DIRECTO',
        JSONB_BUILD_OBJECT(
          'permisos', v_registro.permisos,
          'decision', 'DEC-199'
        ),
        JSONB_BUILD_OBJECT(
          'permisos', v_permisos_despues,
          'decision', 'DEC-199',
          'motivo', 'Administracion define y publica directamente los parametros de M11'
        ),
        NULL,
        NULL
      );
    END IF;
  END LOOP;

  FOR v_registro IN
    SELECT u.id, UPPER(r.nombre) AS rol_nombre, u.permisos_personalizados AS permisos
    FROM public.usuarios u
    INNER JOIN public.roles r ON r.id = u.rol_id
    WHERE u.permisos_personalizados IS NOT NULL
    ORDER BY u.id
    FOR UPDATE OF u
  LOOP
    v_permisos_base := v_registro.permisos;

    SELECT COALESCE(JSONB_AGG(valor ORDER BY valor), '[]'::JSONB)
    INTO v_capacidades
    FROM (
      SELECT DISTINCT valor
      FROM JSONB_ARRAY_ELEMENTS_TEXT(
        CASE
          WHEN JSONB_TYPEOF(v_permisos_base -> 'capacidades') = 'array'
            THEN v_permisos_base -> 'capacidades'
          ELSE '[]'::JSONB
        END
      ) AS capacidad(valor)
      WHERE valor NOT IN ('parametros:aprobar', 'parametros:rechazar')
      UNION
      SELECT UNNEST(ARRAY[
        'parametros:leer',
        'parametros:actualizar',
        'parametros:registrar'
      ])
      WHERE v_registro.rol_nombre = 'ADMINISTRADOR'
    ) AS capacidades;

    v_permisos_despues := JSONB_SET(
      v_permisos_base,
      '{capacidades}',
      v_capacidades,
      TRUE
    );

    IF v_permisos_despues IS DISTINCT FROM v_registro.permisos THEN
      UPDATE public.usuarios
      SET permisos_personalizados = v_permisos_despues,
          updated_at = NOW()
      WHERE id = v_registro.id;

      INSERT INTO public.audit_log (
        tabla, registro_id, accion, datos_antes, datos_despues, usuario_id, ip_address
      ) VALUES (
        'usuarios',
        v_registro.id,
        'PARAM_ADMIN_DIRECTO',
        JSONB_BUILD_OBJECT(
          'permisos', v_registro.permisos,
          'decision', 'DEC-199'
        ),
        JSONB_BUILD_OBJECT(
          'permisos', v_permisos_despues,
          'decision', 'DEC-199',
          'motivo', 'Alinear permisos personalizados con la publicacion directa de M11'
        ),
        NULL,
        NULL
      );
    END IF;
  END LOOP;
END
$$;

COMMIT;
