BEGIN;

DO $$
DECLARE
  v_auditoria RECORD;
  v_permisos_actuales JSONB;
  v_permisos_antes JSONB;
  v_permisos_despues JSONB;
BEGIN
  FOR v_auditoria IN
    SELECT DISTINCT ON (tabla, registro_id)
      tabla,
      registro_id,
      datos_antes,
      datos_despues
    FROM public.audit_log
    WHERE accion = 'PARAM_LEER_TMP'
      AND datos_despues ->> 'decision' = 'DEC-189'
      AND tabla IN ('roles', 'usuarios')
    ORDER BY tabla, registro_id, created_at DESC, id DESC
  LOOP
    v_permisos_antes := v_auditoria.datos_antes -> 'permisos';
    v_permisos_despues := v_auditoria.datos_despues -> 'permisos';

    IF v_permisos_antes = 'null'::JSONB THEN
      v_permisos_antes := NULL;
    END IF;

    IF v_auditoria.tabla = 'roles' THEN
      SELECT permisos
      INTO v_permisos_actuales
      FROM public.roles
      WHERE id = v_auditoria.registro_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe el rol % requerido para revertir DEC-189',
          v_auditoria.registro_id;
      END IF;

      IF v_permisos_actuales IS DISTINCT FROM v_permisos_despues THEN
        RAISE EXCEPTION 'Los permisos del rol % cambiaron despues de DEC-189; se requiere revision manual',
          v_auditoria.registro_id;
      END IF;

      UPDATE public.roles
      SET permisos = v_permisos_antes,
          updated_at = NOW()
      WHERE id = v_auditoria.registro_id;
    ELSE
      SELECT permisos_personalizados
      INTO v_permisos_actuales
      FROM public.usuarios
      WHERE id = v_auditoria.registro_id
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'No existe el usuario % requerido para revertir DEC-189',
          v_auditoria.registro_id;
      END IF;

      IF v_permisos_actuales IS DISTINCT FROM v_permisos_despues THEN
        RAISE EXCEPTION 'Los permisos personalizados del usuario % cambiaron despues de DEC-189; se requiere revision manual',
          v_auditoria.registro_id;
      END IF;

      UPDATE public.usuarios
      SET permisos_personalizados = v_permisos_antes,
          updated_at = NOW()
      WHERE id = v_auditoria.registro_id;
    END IF;

    INSERT INTO public.audit_log (
      tabla,
      registro_id,
      accion,
      datos_antes,
      datos_despues,
      usuario_id,
      ip_address
    ) VALUES (
      v_auditoria.tabla,
      v_auditoria.registro_id,
      'RB_PARAM_LEER_TMP',
      JSONB_BUILD_OBJECT(
        'permisos', v_permisos_actuales,
        'decision', 'DEC-189'
      ),
      JSONB_BUILD_OBJECT(
        'permisos', v_permisos_antes,
        'decision', 'DEC-189'
      ),
      NULL,
      NULL
    );
  END LOOP;
END
$$;

ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_permisos_capacidades_formato_check;

ALTER TABLE public.roles
  DROP CONSTRAINT IF EXISTS roles_permisos_capacidades_formato_check;

COMMIT;
