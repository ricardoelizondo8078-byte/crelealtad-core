BEGIN;

DO $$
DECLARE
  v_registro RECORD;
  v_permisos_base JSONB;
  v_capacidades JSONB;
  v_permisos_despues JSONB;
BEGIN
  FOR v_registro IN
    SELECT id, permisos
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
      UNION
      SELECT 'parametros:leer'
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
        tabla,
        registro_id,
        accion,
        datos_antes,
        datos_despues,
        usuario_id,
        ip_address
      ) VALUES (
        'roles',
        v_registro.id,
        'PARAM_LEER_TMP',
        JSONB_BUILD_OBJECT(
          'permisos', v_registro.permisos,
          'decision', 'DEC-189'
        ),
        JSONB_BUILD_OBJECT(
          'permisos', v_permisos_despues,
          'decision', 'DEC-189',
          'motivo', 'Consulta temporal de Parametros para todos los usuarios'
        ),
        NULL,
        NULL
      );
    END IF;
  END LOOP;

  FOR v_registro IN
    SELECT id, permisos_personalizados AS permisos
    FROM public.usuarios
    WHERE permisos_personalizados IS NOT NULL
    ORDER BY id
    FOR UPDATE
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
      UNION
      SELECT 'parametros:leer'
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
        tabla,
        registro_id,
        accion,
        datos_antes,
        datos_despues,
        usuario_id,
        ip_address
      ) VALUES (
        'usuarios',
        v_registro.id,
        'PARAM_LEER_TMP',
        JSONB_BUILD_OBJECT(
          'permisos', v_registro.permisos,
          'decision', 'DEC-189'
        ),
        JSONB_BUILD_OBJECT(
          'permisos', v_permisos_despues,
          'decision', 'DEC-189',
          'motivo', 'Consulta temporal de Parametros para todos los usuarios'
        ),
        NULL,
        NULL
      );
    END IF;
  END LOOP;
END
$$;

ALTER TABLE public.roles
  ADD CONSTRAINT roles_permisos_capacidades_formato_check
  CHECK (
    permisos IS NULL
    OR NOT (permisos ? 'capacidades')
    OR (
      JSONB_TYPEOF(permisos -> 'capacidades') = 'array'
      AND NOT JSONB_PATH_EXISTS(
        permisos,
        '$.capacidades[*] ? (@.type() != "string")'
      )
    )
  ) NOT VALID;

ALTER TABLE public.roles
  VALIDATE CONSTRAINT roles_permisos_capacidades_formato_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_permisos_capacidades_formato_check
  CHECK (
    permisos_personalizados IS NULL
    OR NOT (permisos_personalizados ? 'capacidades')
    OR (
      JSONB_TYPEOF(permisos_personalizados -> 'capacidades') = 'array'
      AND NOT JSONB_PATH_EXISTS(
        permisos_personalizados,
        '$.capacidades[*] ? (@.type() != "string")'
      )
    )
  ) NOT VALID;

ALTER TABLE public.usuarios
  VALIDATE CONSTRAINT usuarios_permisos_capacidades_formato_check;

COMMIT;
