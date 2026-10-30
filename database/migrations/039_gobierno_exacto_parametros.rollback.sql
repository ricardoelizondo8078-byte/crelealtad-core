BEGIN;

DO $$
DECLARE
  v_auditoria RECORD;
  v_permisos_actuales JSONB;
  v_permisos_antes JSONB;
  v_permisos_despues JSONB;
BEGIN
  FOR v_auditoria IN
    SELECT DISTINCT ON (registro_id)
      registro_id,
      datos_antes,
      datos_despues
    FROM public.audit_log
    WHERE tabla = 'roles'
      AND accion = 'PARAM_GOB_EXACTO'
      AND datos_despues ->> 'decision' = 'DEC-189'
    ORDER BY registro_id, created_at DESC, id DESC
  LOOP
    SELECT permisos
    INTO v_permisos_actuales
    FROM public.roles
    WHERE id = v_auditoria.registro_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'No existe el rol % requerido para revertir el gobierno exacto de Parametros',
        v_auditoria.registro_id;
    END IF;

    v_permisos_antes := v_auditoria.datos_antes -> 'permisos';
    v_permisos_despues := v_auditoria.datos_despues -> 'permisos';
    IF v_permisos_antes = 'null'::JSONB THEN
      v_permisos_antes := NULL;
    END IF;

    IF v_permisos_actuales IS DISTINCT FROM v_permisos_despues THEN
      RAISE EXCEPTION 'Los permisos del rol % cambiaron despues de la migracion 039; se requiere revision manual',
        v_auditoria.registro_id;
    END IF;

    UPDATE public.roles
    SET permisos = v_permisos_antes,
        updated_at = NOW()
    WHERE id = v_auditoria.registro_id;

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
      v_auditoria.registro_id,
      'RB_PARAM_GOB_EXACTO',
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

COMMIT;
