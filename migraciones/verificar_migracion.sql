-- =====================================================
-- VERIFICACIÓN DE DATOS MIGRADOS
-- =====================================================

-- Tabla: personas
SELECT '========== PERSONAS: 10 registros migrados ==========' as verificacion;

SELECT
  id,
  folio,
  primer_nombre as "Primer Nombre (VIEJO)",
  segundo_nombre as "Segundo Nombre (VIEJO)",
  nombres as "NOMBRES (NUEVO)",
  apellido_pat as "Apellido Paterno",
  apellido_mat as "Apellido Materno",
  nombre_completo as "NOMBRE COMPLETO (GENERADO)"
FROM personas
ORDER BY created_at DESC
LIMIT 10;

-- Tabla: solicitudes_datos_personales
SELECT '========== SOLICITUDES_DATOS_PERSONALES: 10 registros migrados ==========' as verificacion;

SELECT
  solicitud_id,
  primer_nombre as "Primer Nombre (VIEJO)",
  segundo_nombre as "Segundo Nombre (VIEJO)",
  nombres as "NOMBRES (NUEVO)",
  apellido_pat as "Apellido Paterno",
  apellido_mat as "Apellido Materno",
  nombre_completo as "NOMBRE COMPLETO (GENERADO)"
FROM solicitudes_datos_personales
WHERE nombres IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
