BEGIN;

DO $$
DECLARE
  v_actor UUID;
  v_motivo RECORD;
  v_id UUID;
  v_insertado BOOLEAN;
  v_activos INTEGER;
BEGIN
  SELECT usuario.id
  INTO v_actor
  FROM public.usuarios AS usuario
  INNER JOIN public.roles AS rol ON rol.id = usuario.rol_id
  WHERE usuario.estado = 'ACTIVO'
  ORDER BY
    CASE WHEN UPPER(rol.nombre) = 'ADMINISTRADOR' THEN 0 ELSE 1 END,
    usuario.created_at ASC,
    usuario.id ASC
  LIMIT 1;

  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'Se requiere un usuario activo como actor técnico del catálogo base de motivos';
  END IF;

  FOR v_motivo IN
    SELECT *
    FROM (VALUES
      ('b0510000-0000-4000-8000-000000000001'::UUID, 'VERDE', 'Documento legible y completo', 'DOCUMENTO LEGIBLE Y COMPLETO'),
      ('b0510000-0000-4000-8000-000000000002'::UUID, 'VERDE', 'Datos coinciden con lo declarado', 'DATOS COINCIDEN CON LO DECLARADO'),
      ('b0510000-0000-4000-8000-000000000003'::UUID, 'VERDE', 'Pagos al corriente', 'PAGOS AL CORRIENTE'),
      ('b0510000-0000-4000-8000-000000000004'::UUID, 'VERDE', 'Referencia favorable de la financiera', 'REFERENCIA FAVORABLE DE LA FINANCIERA'),
      ('b0510000-0000-4000-8000-000000000005'::UUID, 'VERDE', 'Sin inconsistencias visibles', 'SIN INCONSISTENCIAS VISIBLES'),
      ('b0510000-0000-4000-8000-000000000006'::UUID, 'AMARILLO', 'Documento parcialmente legible', 'DOCUMENTO PARCIALMENTE LEGIBLE'),
      ('b0510000-0000-4000-8000-000000000007'::UUID, 'AMARILLO', 'Información incompleta', 'INFORMACION INCOMPLETA'),
      ('b0510000-0000-4000-8000-000000000008'::UUID, 'AMARILLO', 'Datos pendientes de confirmar', 'DATOS PENDIENTES DE CONFIRMAR'),
      ('b0510000-0000-4000-8000-000000000009'::UUID, 'AMARILLO', 'Atrasos ocasionales', 'ATRASOS OCASIONALES'),
      ('b0510000-0000-4000-8000-000000000010'::UUID, 'AMARILLO', 'Diferencias menores en la información', 'DIFERENCIAS MENORES EN LA INFORMACION'),
      ('b0510000-0000-4000-8000-000000000011'::UUID, 'ROJO', 'Documento ilegible o no verificable', 'DOCUMENTO ILEGIBLE O NO VERIFICABLE'),
      ('b0510000-0000-4000-8000-000000000012'::UUID, 'ROJO', 'Información contradictoria', 'INFORMACION CONTRADICTORIA'),
      ('b0510000-0000-4000-8000-000000000013'::UUID, 'ROJO', 'Mora o atraso grave', 'MORA O ATRASO GRAVE'),
      ('b0510000-0000-4000-8000-000000000014'::UUID, 'ROJO', 'Incumplimiento recurrente', 'INCUMPLIMIENTO RECURRENTE'),
      ('b0510000-0000-4000-8000-000000000015'::UUID, 'ROJO', 'Datos presuntamente alterados', 'DATOS PRESUNTAMENTE ALTERADOS')
    ) AS catalogo(id, clasificacion, concepto, concepto_normalizado)
  LOOP
    v_insertado := FALSE;

    SELECT COUNT(*)::INTEGER
    INTO v_activos
    FROM public.motivos_clasificacion_evidencia AS motivo
    WHERE motivo.clasificacion = v_motivo.clasificacion
      AND motivo.activo = TRUE;

    IF v_activos >= 5 THEN
      CONTINUE;
    END IF;

    SELECT motivo.id
    INTO v_id
    FROM public.motivos_clasificacion_evidencia AS motivo
    WHERE motivo.clasificacion = v_motivo.clasificacion
      AND motivo.concepto_normalizado = v_motivo.concepto_normalizado
    FOR UPDATE;

    IF v_id IS NULL THEN
      INSERT INTO public.motivos_clasificacion_evidencia (
        id,
        clasificacion,
        concepto,
        concepto_normalizado,
        activo,
        created_by
      ) VALUES (
        v_motivo.id,
        v_motivo.clasificacion,
        v_motivo.concepto,
        v_motivo.concepto_normalizado,
        TRUE,
        v_actor
      )
      RETURNING id INTO v_id;
      v_insertado := TRUE;
    END IF;

    IF v_insertado THEN
      INSERT INTO public.audit_log (
        tabla,
        registro_id,
        accion,
        datos_antes,
        datos_despues,
        usuario_id,
        ip_address
      ) VALUES (
        'motivos_clasificacion_evidencia',
        v_id,
        'MOT_EVI_BASE',
        NULL,
        JSONB_BUILD_OBJECT(
          'clasificacion', v_motivo.clasificacion,
          'concepto', v_motivo.concepto,
          'activo', TRUE,
          'decision', 'DEC-215'
        ),
        v_actor,
        NULL
      );
    END IF;
  END LOOP;
END
$$;

COMMIT;
