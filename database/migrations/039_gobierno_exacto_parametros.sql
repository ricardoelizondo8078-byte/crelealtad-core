BEGIN;

DO $$
DECLARE
  v_registro RECORD;
  v_permisos_base JSONB;
  v_capacidades JSONB;
  v_permisos_despues JSONB;
  v_capacidades_requeridas TEXT[];
BEGIN
  IF (
    SELECT COUNT(*)
    FROM public.roles
    WHERE UPPER(nombre) IN ('ADMINISTRADOR', 'GERENTE')
  ) = 1 THEN
    RAISE EXCEPTION 'La configuración es incompleta: deben existir juntos ADMINISTRADOR y GERENTE';
  END IF;

  FOR v_registro IN
    SELECT id, UPPER(nombre) AS nombre, permisos
    FROM public.roles
    WHERE UPPER(nombre) IN ('ADMINISTRADOR', 'GERENTE')
    ORDER BY id
    FOR UPDATE
  LOOP
    v_permisos_base := COALESCE(
      v_registro.permisos,
      '{"modulos":[],"acciones":[]}'::JSONB
    );
    v_capacidades_requeridas := CASE v_registro.nombre
      WHEN 'ADMINISTRADOR' THEN ARRAY[
        'parametros:leer',
        'parametros:actualizar',
        'parametros:registrar'
      ]
      ELSE ARRAY[
        'parametros:leer',
        'parametros:aprobar',
        'parametros:rechazar'
      ]
    END;

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
      SELECT UNNEST(v_capacidades_requeridas)
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
        'PARAM_GOB_EXACTO',
        JSONB_BUILD_OBJECT(
          'permisos', v_registro.permisos,
          'decision', 'DEC-189'
        ),
        JSONB_BUILD_OBJECT(
          'permisos', v_permisos_despues,
          'decision', 'DEC-189',
          'motivo', 'Alinear acciones exactas de Parametros con el doble control'
        ),
        NULL,
        NULL
      );
    END IF;
  END LOOP;
END
$$;

COMMIT;
