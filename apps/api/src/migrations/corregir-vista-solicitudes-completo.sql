-- =====================================================
-- CORRECCIÓN: Vista solicitudes_completo
-- Agrega columnas faltantes que la entidad espera
-- =====================================================

BEGIN;

-- Primero agregar las columnas faltantes en la tabla solicitudes_documentos
ALTER TABLE solicitudes_documentos
  ADD COLUMN IF NOT EXISTS doc_comprobante_credito_ruta VARCHAR(500),
  ADD COLUMN IF NOT EXISTS doc_comprobante_credito_fecha DATE;

COMMENT ON COLUMN solicitudes_documentos.doc_comprobante_credito_ruta
  IS 'Ruta del comprobante de crédito (ej: historial crediticio)';

COMMENT ON COLUMN solicitudes_documentos.doc_comprobante_credito_fecha
  IS 'Fecha de captura del comprobante de crédito';

-- Agregar columnas nombres y nombre_completo en solicitudes_datos_personales
ALTER TABLE solicitudes_datos_personales
  ADD COLUMN IF NOT EXISTS nombres VARCHAR(150),
  ADD COLUMN IF NOT EXISTS nombre_completo VARCHAR(255) GENERATED ALWAYS AS (
    TRIM(CONCAT(nombres, ' ', apellido_pat, ' ', COALESCE(apellido_mat, '')))
  ) STORED;

COMMENT ON COLUMN solicitudes_datos_personales.nombres
  IS 'Nombres completos (refactor: reemplaza primer_nombre + segundo_nombre)';

COMMENT ON COLUMN solicitudes_datos_personales.nombre_completo
  IS 'COLUMNA GENERADA: Nombre completo = nombres + apellido_pat + apellido_mat';

-- Recrear la vista solicitudes_completo con TODAS las columnas
DROP VIEW IF EXISTS solicitudes_completo CASCADE;

CREATE OR REPLACE VIEW solicitudes_completo AS
SELECT
  s.id as solicitud_id,
  s.folio,
  s.integrante_id,
  s.integrante_id_old,
  s.persona_id,
  s.expediente_id,
  s.grupo_id,
  s.credito_id,
  s.ciclo_numero,
  s.numero_credito,
  s.monto_solicitado,
  s.monto_autorizado,

  -- Datos personales (refactor: nombres unificados)
  dp.nombres,                    -- ✅ AGREGADO
  dp.apellido_pat,
  dp.apellido_mat,
  dp.nombre_completo,            -- ✅ AGREGADO (generado)
  dp.curp,
  dp.fecha_nac,
  dp.genero,
  dp.nacionalidad,
  dp.estado_nacimiento,
  dp.estado_civil,
  dp.ocupacion,
  dp.nivel_estudio,

  -- Domicilio
  dom.dom_calle,
  dom.dom_num_ext,
  dom.dom_num_int,
  dom.dom_entre_calles,
  dom.dom_colonia,
  dom.dom_municipio,
  dom.dom_estado,
  dom.dom_codigo_postal,
  dom.dom_telefono,

  -- Negocio
  neg.negocio_giro,
  neg.negocio_domicilio,
  neg.negocio_colonia,
  neg.negocio_municipio,
  neg.negocio_estado,
  neg.negocio_codigo_postal,
  neg.negocio_num_ext,
  neg.negocio_num_int,
  neg.negocio_desde_cuando,
  neg.negocio_ingreso_semanal,
  neg.negocio_otros_ingresos,
  neg.negocio_gastos,
  neg.negocio_total,

  -- Referencias
  ref.ref1_nombre,
  ref.ref1_parentesco,
  ref.ref1_telefono,
  ref.ref1_direccion,
  ref.ref2_nombre,
  ref.ref2_parentesco,
  ref.ref2_telefono,
  ref.ref2_direccion,
  ref.pareja_nombre,
  ref.pareja_actividad,
  ref.pareja_ingreso_semanal,

  -- Beneficiario
  ben.beneficiario_nombre,
  ben.beneficiario_parentesco,
  ben.beneficiario_telefono,
  ben.beneficiario_direccion,

  -- Validaciones
  val.tiene_medidor_luz,
  val.vive_max_5km_tesorera,
  val.tiene_menos_70_anios,

  -- Documentos (TODOS los campos)
  doc.doc_ine_ruta,
  doc.doc_ine_fecha,
  doc.doc_comprobante_ruta,
  doc.doc_comprobante_fecha,
  doc.doc_ine_beneficiario_ruta,
  doc.doc_ine_beneficiario_fecha,
  doc.doc_solicitud_firmada_ruta,
  doc.doc_solicitud_firmada_fecha,
  doc.doc_comprobante_credito_ruta,      -- ✅ AGREGADO
  doc.doc_comprobante_credito_fecha,     -- ✅ AGREGADO

  -- Timestamps
  s.created_at,
  s.updated_at

FROM solicitudes s
LEFT JOIN solicitudes_datos_personales dp ON dp.solicitud_id = s.id
LEFT JOIN solicitudes_domicilios dom ON dom.solicitud_id = s.id
LEFT JOIN solicitudes_negocios neg ON neg.solicitud_id = s.id
LEFT JOIN solicitudes_referencias ref ON ref.solicitud_id = s.id
LEFT JOIN solicitudes_beneficiarios ben ON ben.solicitud_id = s.id
LEFT JOIN solicitudes_validaciones val ON val.solicitud_id = s.id
LEFT JOIN solicitudes_documentos doc ON doc.solicitud_id = s.id;

COMMENT ON VIEW solicitudes_completo IS
  'Vista consolidada COMPLETA con refactor de nombres + doc_comprobante_credito';

COMMIT;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que la vista tiene las columnas esperadas
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'solicitudes_completo'
  AND column_name IN ('nombres', 'nombre_completo', 'doc_comprobante_credito_ruta', 'doc_comprobante_credito_fecha')
ORDER BY column_name;
