-- =====================================================
-- MIGRACIÓN 3: Redefinir vista solicitudes_completo
-- (Incluye columnas NUEVAS y LEGACY para transición)
-- =====================================================

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

  -- ✅ Datos personales (NUEVA ESTRUCTURA)
  dp.nombres,
  dp.apellido_pat,
  dp.apellido_mat,
  dp.nombre_completo,

  -- ⚠️ Campos legacy (MANTENER HASTA VERIFICAR)
  dp.primer_nombre,
  dp.segundo_nombre,

  -- Resto de datos personales
  dp.curp,
  dp.fecha_nac,
  dp.genero,
  dp.nacionalidad,
  dp.estado_nacimiento,
  dp.estado_civil,
  dp.ocupacion,
  dp.nivel_estudio,
  dp.telefono,

  -- Domicilio
  dom.dom_calle,
  dom.dom_num_ext,
  dom.dom_num_int,
  dom.dom_entre_calles,
  dom.dom_colonia,
  dom.dom_municipio,
  dom.dom_estado,
  dom.dom_codigo_postal,
  dom.dom_cp_id,
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

  -- Documentos
  doc.doc_ine_ruta,
  doc.doc_ine_fecha,
  doc.doc_comprobante_ruta,
  doc.doc_comprobante_fecha,
  doc.doc_ine_beneficiario_ruta,
  doc.doc_ine_beneficiario_fecha,
  doc.doc_solicitud_firmada_ruta,
  doc.doc_solicitud_firmada_fecha,

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

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT
  solicitud_id,
  nombres,
  apellido_pat,
  apellido_mat,
  nombre_completo,
  primer_nombre,  -- legacy
  segundo_nombre  -- legacy
FROM solicitudes_completo
WHERE nombres IS NOT NULL
LIMIT 10;
