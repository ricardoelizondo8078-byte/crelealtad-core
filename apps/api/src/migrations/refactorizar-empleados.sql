-- =====================================================
-- REFACTORIZACIÓN COMPLETA: ASESORAS → EMPLEADOS
-- =====================================================
-- CAMBIOS:
-- 1. Renombrar asesoras → empleados (genérico para todos)
-- 2. Separar nombre en usuarios (nombre, apellido_paterno, apellido_materno)
-- 3. Eliminar duplicación de nombres
-- 4. Crear roles adicionales
-- =====================================================

-- =====================================================
-- PASO 1: MODIFICAR TABLA USUARIOS (Separar nombre)
-- =====================================================

-- 1.1 Agregar columnas de nombre separadas
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS apellido_paterno VARCHAR(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS apellido_materno VARCHAR(100);

-- 1.2 Renombrar columna nombre → nombre_completo (temporal)
ALTER TABLE usuarios RENAME COLUMN nombre TO nombre_completo;

-- 1.3 Crear nueva columna nombre (solo primer nombre)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nombre VARCHAR(100);

-- 1.4 Migrar datos existentes (dividir nombre completo)
-- Por ahora dejamos nombre_completo para no perder datos
-- En el script de importación separaremos correctamente

-- 1.5 Comentarios
COMMENT ON COLUMN usuarios.nombre IS 'Nombre(s) del usuario';
COMMENT ON COLUMN usuarios.apellido_paterno IS 'Apellido paterno';
COMMENT ON COLUMN usuarios.apellido_materno IS 'Apellido materno';
COMMENT ON COLUMN usuarios.nombre_completo IS 'DEPRECADO - usar nombre + apellidos';

-- =====================================================
-- PASO 2: RENOMBRAR ASESORAS → EMPLEADOS
-- =====================================================

-- 2.1 Renombrar tabla principal
ALTER TABLE asesoras RENAME TO empleados;

-- 2.2 Renombrar tablas relacionadas
ALTER TABLE asesoras_contacto RENAME TO empleados_contacto;
ALTER TABLE asesoras_domicilios RENAME TO empleados_domicilios;
ALTER TABLE asesoras_documentos RENAME TO empleados_documentos;
ALTER TABLE asesoras_datos_laborales RENAME TO empleados_datos_laborales;

-- 2.3 Renombrar columnas FK (asesor_id → empleado_id)
ALTER TABLE empleados_contacto RENAME COLUMN asesor_id TO empleado_id;
ALTER TABLE empleados_domicilios RENAME COLUMN asesor_id TO empleado_id;
ALTER TABLE empleados_documentos RENAME COLUMN asesor_id TO empleado_id;
ALTER TABLE empleados_datos_laborales RENAME COLUMN asesor_id TO empleado_id;

-- 2.4 Renombrar constraints (nombres internos)
ALTER TABLE empleados_contacto RENAME CONSTRAINT fk_contacto_asesor TO fk_contacto_empleado;
ALTER TABLE empleados_domicilios RENAME CONSTRAINT fk_domicilio_asesor TO fk_domicilio_empleado;
ALTER TABLE empleados_documentos RENAME CONSTRAINT fk_documento_asesor TO fk_documento_empleado;
ALTER TABLE empleados_datos_laborales RENAME CONSTRAINT fk_laboral_asesor TO fk_laboral_empleado;

-- 2.5 Renombrar índices
ALTER INDEX IF EXISTS idx_asesoras_contacto_asesor RENAME TO idx_empleados_contacto_empleado;
ALTER INDEX IF EXISTS idx_asesoras_domicilios_asesor RENAME TO idx_empleados_domicilios_empleado;
ALTER INDEX IF EXISTS idx_asesoras_documentos_asesor RENAME TO idx_empleados_documentos_empleado;
ALTER INDEX IF EXISTS idx_asesoras_laborales_asesor RENAME TO idx_empleados_laborales_empleado;

-- 2.6 Renombrar constraint UNIQUE
ALTER TABLE empleados RENAME CONSTRAINT asesoras_usuario_id_unique TO empleados_usuario_id_unique;

-- =====================================================
-- PASO 3: ELIMINAR DUPLICACIÓN DE NOMBRES
-- =====================================================

-- 3.1 Eliminar nombre, apellido_paterno, apellido_materno de empleados
-- El nombre SIEMPRE viene de la tabla usuarios
ALTER TABLE empleados DROP COLUMN IF EXISTS nombre CASCADE;
ALTER TABLE empleados DROP COLUMN IF EXISTS apellido_paterno CASCADE;
ALTER TABLE empleados DROP COLUMN IF EXISTS apellido_materno CASCADE;

-- Ahora empleados tiene:
-- id, folio, usuario_id, zona_id
-- fecha_nacimiento, genero, curp, rfc, fecha_ingreso
-- created_at, updated_at
-- (11 columnas - ÓPTIMO)

-- =====================================================
-- PASO 4: AGREGAR COLUMNA TIPO_EMPLEADO (Opcional)
-- =====================================================

-- Agregar columna para clasificar tipo de empleado
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS tipo_empleado VARCHAR(50);

-- Valores permitidos:
-- ASESOR, COORDINADOR, GERENTE, RECOLECTOR, VERIFICADOR, COBRADOR, DESEMBOLSADOR

-- Poblar con datos existentes (todos son ASESOR)
UPDATE empleados SET tipo_empleado = 'ASESOR' WHERE tipo_empleado IS NULL;

-- Hacer NOT NULL
ALTER TABLE empleados ALTER COLUMN tipo_empleado SET NOT NULL;

COMMENT ON COLUMN empleados.tipo_empleado IS 'Tipo: ASESOR | COORDINADOR | GERENTE | RECOLECTOR | VERIFICADOR | COBRADOR | DESEMBOLSADOR';

-- =====================================================
-- PASO 5: ACTUALIZAR COMENTARIOS
-- =====================================================

COMMENT ON TABLE empleados IS 'Datos personales de todos los empleados (11 columnas)';
COMMENT ON TABLE empleados_contacto IS 'Información de contacto del empleado';
COMMENT ON TABLE empleados_domicilios IS 'Domicilio completo y geolocalización del empleado';
COMMENT ON TABLE empleados_documentos IS 'Fotografías y documentos del empleado con historial';
COMMENT ON TABLE empleados_datos_laborales IS 'Información laboral, jerarquía y metas del empleado';

-- =====================================================
-- PASO 6: CREAR VISTA PARA COMPATIBILIDAD
-- =====================================================

-- Vista que une usuarios + empleados con nombre completo
CREATE OR REPLACE VIEW empleados_completo AS
SELECT
  e.id as empleado_id,
  e.folio,
  e.usuario_id,
  e.zona_id,
  e.tipo_empleado,

  -- Nombre del usuario
  u.nombre,
  u.apellido_paterno,
  u.apellido_materno,
  u.nombre || ' ' || u.apellido_paterno || COALESCE(' ' || u.apellido_materno, '') as nombre_completo,

  -- Datos personales
  e.fecha_nacimiento,
  e.genero,
  e.curp,
  e.rfc,
  e.fecha_ingreso,

  -- Usuario
  u.email,
  u.estado as usuario_estado,
  u.rol_id,
  u.sucursal_id as usuario_sucursal_id,

  -- Timestamps
  e.created_at,
  e.updated_at

FROM empleados e
INNER JOIN usuarios u ON u.id = e.usuario_id;

COMMENT ON VIEW empleados_completo IS 'Vista consolidada: empleados + usuarios con nombre completo';

-- =====================================================
-- RESULTADO FINAL
-- =====================================================

-- USUARIOS (14 columnas):
--   id, folio, nombre, apellido_paterno, apellido_materno,
--   email, password_hash, rol_id, sucursal_id, estado,
--   ultimo_login, created_at, updated_at, nombre_completo

-- EMPLEADOS (12 columnas):
--   id, folio, usuario_id, zona_id, tipo_empleado,
--   fecha_nacimiento, genero, curp, rfc, fecha_ingreso,
--   created_at, updated_at

-- EMPLEADOS_CONTACTO (9 columnas):
--   id, empleado_id, telefono_celular, telefono_casa, telefono_emergencia,
--   emergencia_nombre, emergencia_parentesco, created_at, updated_at

-- EMPLEADOS_DOMICILIOS (15 columnas):
--   id, empleado_id, calle, numero_ext, numero_int, colonia, municipio,
--   estado, codigo_postal, referencias, latitud, longitud,
--   geolocalizacion_fecha, created_at, updated_at

-- EMPLEADOS_DOCUMENTOS (8 columnas):
--   id, empleado_id, tipo_documento, ruta_archivo, fecha_captura,
--   estado, created_at, updated_at

-- EMPLEADOS_DATOS_LABORALES (11 columnas):
--   id, empleado_id, sucursal_id, jefe_inmediato_id, tipo_contrato,
--   nivel, meta_mensual_grupos, meta_mensual_monto, observaciones,
--   created_at, updated_at
