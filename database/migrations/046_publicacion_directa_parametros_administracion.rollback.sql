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
    WHERE tabla IN ('roles', 'usuarios')
      AND accion = 'PARAM_ADMIN_DIRECTO'
      AND datos_despues ->> 'decision' = 'DEC-199'
    ORDER BY tabla, registro_id, created_at DESC, id DESC
  LOOP
    IF v_auditoria.tabla = 'roles' THEN
      SELECT permisos
      INTO v_permisos_actuales
      FROM public.roles
      WHERE id = v_auditoria.registro_id
      FOR UPDATE;
    ELSE
      SELECT permisos_personalizados
      INTO v_permisos_actuales
      FROM public.usuarios
      WHERE id = v_auditoria.registro_id
      FOR UPDATE;
    END IF;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No existe el registro %:% requerido para revertir DEC-199',
        v_auditoria.tabla,
        v_auditoria.registro_id;
    END IF;

    v_permisos_antes := v_auditoria.datos_antes -> 'permisos';
    v_permisos_despues := v_auditoria.datos_despues -> 'permisos';
    IF v_permisos_antes = 'null'::JSONB THEN
      v_permisos_antes := NULL;
    END IF;

    IF v_permisos_actuales IS DISTINCT FROM v_permisos_despues THEN
      RAISE EXCEPTION
        'Los permisos de %:% cambiaron despues de la migracion 046; se requiere revision manual',
        v_auditoria.tabla,
        v_auditoria.registro_id;
    END IF;

    IF v_auditoria.tabla = 'roles' THEN
      UPDATE public.roles
      SET permisos = v_permisos_antes,
          updated_at = NOW()
      WHERE id = v_auditoria.registro_id;
    ELSE
      UPDATE public.usuarios
      SET permisos_personalizados = v_permisos_antes,
          updated_at = NOW()
      WHERE id = v_auditoria.registro_id;
    END IF;

    INSERT INTO public.audit_log (
      tabla, registro_id, accion, datos_antes, datos_despues, usuario_id, ip_address
    ) VALUES (
      v_auditoria.tabla,
      v_auditoria.registro_id,
      'RB_PARAM_ADMIN_DIR',
      JSONB_BUILD_OBJECT(
        'permisos', v_permisos_actuales,
        'decision', 'DEC-199'
      ),
      JSONB_BUILD_OBJECT(
        'permisos', v_permisos_antes,
        'decision', 'DEC-199'
      ),
      NULL,
      NULL
    );
  END LOOP;
END
$$;

COMMIT;
