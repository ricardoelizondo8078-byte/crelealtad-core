BEGIN;

ALTER TABLE public.financieras_competidoras
  ADD COLUMN catalogo_base BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
DECLARE
  v_actor UUID;
  v_financiera RECORD;
  v_id UUID;
  v_catalogo_base_anterior BOOLEAN;
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
    RAISE EXCEPTION 'Se requiere un usuario activo como actor técnico del catálogo base';
  END IF;

  FOR v_financiera IN
    SELECT *
    FROM (VALUES
      ('b0400000-0000-4000-8000-000000000001'::UUID, 'Banco BanFeliz', 'BANCO BANFELIZ'),
      ('b0400000-0000-4000-8000-000000000002'::UUID, 'Came', 'CAME'),
      ('b0400000-0000-4000-8000-000000000003'::UUID, 'Compartamos Banco', 'COMPARTAMOS BANCO'),
      ('b0400000-0000-4000-8000-000000000004'::UUID, 'Credi Ok', 'CREDI OK'),
      ('b0400000-0000-4000-8000-000000000005'::UUID, 'Crediclub', 'CREDICLUB'),
      ('b0400000-0000-4000-8000-000000000006'::UUID, 'CrediMujer', 'CREDIMUJER'),
      ('b0400000-0000-4000-8000-000000000007'::UUID, 'Crédito Sí (Afirme)', 'CREDITO SI (AFIRME)'),
      ('b0400000-0000-4000-8000-000000000008'::UUID, 'Exitus Contigo', 'EXITUS CONTIGO'),
      ('b0400000-0000-4000-8000-000000000009'::UUID, 'Mi Tandita', 'MI TANDITA'),
      ('b0400000-0000-4000-8000-000000000010'::UUID, 'Seamos Socios', 'SEAMOS SOCIOS'),
      ('b0400000-0000-4000-8000-000000000011'::UUID, 'Solidar', 'SOLIDAR'),
      ('b0400000-0000-4000-8000-000000000012'::UUID, 'Todo Fácil', 'TODO FACIL'),
      ('b0400000-0000-4000-8000-000000000013'::UUID, 'Tuiio (Santander)', 'TUIIO (SANTANDER)')
    ) AS catalogo(id, nombre_oficial, nombre_normalizado)
  LOOP
    SELECT id, catalogo_base
    INTO v_id, v_catalogo_base_anterior
    FROM public.financieras_competidoras
    WHERE nombre_normalizado = v_financiera.nombre_normalizado
    FOR UPDATE;

    IF v_id IS NULL THEN
      INSERT INTO public.financieras_competidoras (
        id,
        nombre_oficial,
        nombre_normalizado,
        catalogo_base,
        created_by
      ) VALUES (
        v_financiera.id,
        v_financiera.nombre_oficial,
        v_financiera.nombre_normalizado,
        TRUE,
        v_actor
      )
      RETURNING id INTO v_id;
    ELSE
      UPDATE public.financieras_competidoras
      SET catalogo_base = TRUE,
          updated_at = NOW()
      WHERE id = v_id;
    END IF;

    IF v_catalogo_base_anterior IS DISTINCT FROM TRUE THEN
      INSERT INTO public.audit_log (
        tabla,
        registro_id,
        accion,
        datos_antes,
        datos_despues,
        usuario_id,
        ip_address
      ) VALUES (
        'financieras_competidoras',
        v_id,
        'FIN_CATALOGO_BASE',
        JSONB_BUILD_OBJECT('catalogo_base', v_catalogo_base_anterior),
        JSONB_BUILD_OBJECT(
          'catalogo_base', TRUE,
          'nombre', v_financiera.nombre_oficial,
          'decision', 'DEC-190'
        ),
        v_actor,
        NULL
      );
    END IF;
  END LOOP;
END
$$;

COMMIT;
