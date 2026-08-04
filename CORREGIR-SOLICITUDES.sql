-- ============================================================
-- CORRECCIÓN DE TABLA SOLICITUDES
-- Base de datos: crelealtad (PostgreSQL LOCAL)
-- ============================================================

\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  CORRECCIÓN DE TABLA: solicitudes                          ║'
\echo '║  Convertir camelCase → snake_case                          ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

-- Iniciar transacción
BEGIN;

\echo '📋 RENOMBRANDO COLUMNAS (46 columnas)...'
\echo ''

-- Beneficiario
ALTER TABLE solicitudes RENAME COLUMN "beneficiarioDireccion" TO beneficiario_direccion;
ALTER TABLE solicitudes RENAME COLUMN "beneficiarioNombreCompleto" TO beneficiario_nombre;
ALTER TABLE solicitudes RENAME COLUMN "beneficiarioParentesco" TO beneficiario_parentesco;
ALTER TABLE solicitudes RENAME COLUMN "beneficiarioTelefono" TO beneficiario_telefono;

-- Domicilio
ALTER TABLE solicitudes RENAME COLUMN "codigoPostal" TO dom_codigo_postal;
ALTER TABLE solicitudes RENAME COLUMN "entreCalles" TO dom_entre_calles;
ALTER TABLE solicitudes RENAME COLUMN "numeroExterior" TO dom_num_ext;
ALTER TABLE solicitudes RENAME COLUMN "numeroInterior" TO dom_num_int;

-- Datos personales
ALTER TABLE solicitudes RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE solicitudes RENAME COLUMN "updatedAt" TO updated_at;
ALTER TABLE solicitudes RENAME COLUMN "estadoCivil" TO estado_civil;
ALTER TABLE solicitudes RENAME COLUMN "estadoNacimiento" TO estado_nacimiento_old;
ALTER TABLE solicitudes RENAME COLUMN "fechaNacimiento" TO fecha_nac;
ALTER TABLE solicitudes RENAME COLUMN "nivelEstudio" TO nivel_estudio;

-- Negocio
ALTER TABLE solicitudes RENAME COLUMN "negocioCalle" TO negocio_domicilio;
ALTER TABLE solicitudes RENAME COLUMN "negocioCodigoPostal" TO negocio_cp_id;
ALTER TABLE solicitudes RENAME COLUMN "negocioColonia" TO negocio_colonia;
ALTER TABLE solicitudes RENAME COLUMN "negocioDesdeCuando" TO negocio_desde_cuando;
ALTER TABLE solicitudes RENAME COLUMN "negocioEstado" TO negocio_estado;
ALTER TABLE solicitudes RENAME COLUMN "negocioGastos" TO negocio_gastos_old;
ALTER TABLE solicitudes RENAME COLUMN "negocioGiro" TO negocio_giro_old;
ALTER TABLE solicitudes RENAME COLUMN "negocioIngresoSemanal" TO negocio_ingreso_semanal;
ALTER TABLE solicitudes RENAME COLUMN "negocioMunicipio" TO negocio_municipio;
ALTER TABLE solicitudes RENAME COLUMN "negocioNumeroExterior" TO negocio_num_ext;
ALTER TABLE solicitudes RENAME COLUMN "negocioNumeroInterior" TO negocio_num_int;
ALTER TABLE solicitudes RENAME COLUMN "negocioOtrosIngresos" TO negocio_otros_ingresos;
ALTER TABLE solicitudes RENAME COLUMN "negocioTotal" TO negocio_total;

-- Pareja
ALTER TABLE solicitudes RENAME COLUMN "parejaActividadEconomica" TO pareja_actividad;
ALTER TABLE solicitudes RENAME COLUMN "parejaIngresoSemanal" TO pareja_ingreso_semanal;
ALTER TABLE solicitudes RENAME COLUMN "parejaNombreCompleto" TO pareja_nombre;

-- Referencias
ALTER TABLE solicitudes RENAME COLUMN "referencia1Direccion" TO ref1_direccion;
ALTER TABLE solicitudes RENAME COLUMN "referencia1NombreCompleto" TO ref1_nombre;
ALTER TABLE solicitudes RENAME COLUMN "referencia1Parentesco" TO ref1_parentesco;
ALTER TABLE solicitudes RENAME COLUMN "referencia1Telefono" TO ref1_telefono;
ALTER TABLE solicitudes RENAME COLUMN "referencia2Direccion" TO ref2_direccion;
ALTER TABLE solicitudes RENAME COLUMN "referencia2NombreCompleto" TO ref2_nombre;
ALTER TABLE solicitudes RENAME COLUMN "referencia2Parentesco" TO ref2_parentesco;
ALTER TABLE solicitudes RENAME COLUMN "referencia2Telefono" TO ref2_telefono;

-- Validaciones
ALTER TABLE solicitudes RENAME COLUMN "tieneMedidorLuzSinAdeudo" TO tiene_medidor_luz;
ALTER TABLE solicitudes RENAME COLUMN "tieneMenos70Anios" TO tiene_menos_70_anios;
ALTER TABLE solicitudes RENAME COLUMN "viveMaximo5KmTesorera" TO vive_max_5km_tesorera;

\echo '✅ Columnas renombradas a snake_case'
\echo ''

-- Limpiar sufijos _nuevo (consolidar columnas)
\echo '📋 CONSOLIDANDO COLUMNAS CON SUFIJO _nuevo...'
\echo ''

-- Si estado_nacimiento_nuevo tiene datos, consolidar
DO $$
BEGIN
  -- Copiar datos de estado_nacimiento_nuevo a estado_nacimiento_old si es NULL
  UPDATE solicitudes
  SET estado_nacimiento_old = estado_nacimiento_nuevo
  WHERE estado_nacimiento_old IS NULL AND estado_nacimiento_nuevo IS NOT NULL;

  -- Renombrar la columna vieja a nueva
  ALTER TABLE solicitudes RENAME COLUMN estado_nacimiento_old TO estado_nacimiento;

  -- Eliminar la columna temporal
  ALTER TABLE solicitudes DROP COLUMN IF EXISTS estado_nacimiento_nuevo;

  RAISE NOTICE '✅ estado_nacimiento consolidado';
END $$;

DO $$
BEGIN
  -- Copiar datos de negocio_giro_nuevo a negocio_giro_old si es NULL
  UPDATE solicitudes
  SET negocio_giro_old = negocio_giro_nuevo
  WHERE negocio_giro_old IS NULL AND negocio_giro_nuevo IS NOT NULL;

  -- Renombrar
  ALTER TABLE solicitudes RENAME COLUMN negocio_giro_old TO negocio_giro;

  -- Eliminar temporal
  ALTER TABLE solicitudes DROP COLUMN IF EXISTS negocio_giro_nuevo;

  RAISE NOTICE '✅ negocio_giro consolidado';
END $$;

DO $$
BEGIN
  -- Copiar datos de negocio_gastos_nuevo a negocio_gastos_old si es NULL
  UPDATE solicitudes
  SET negocio_gastos_old = negocio_gastos_nuevo
  WHERE negocio_gastos_old IS NULL AND negocio_gastos_nuevo IS NOT NULL;

  -- Renombrar
  ALTER TABLE solicitudes RENAME COLUMN negocio_gastos_old TO negocio_gastos;

  -- Eliminar temporal
  ALTER TABLE solicitudes DROP COLUMN IF EXISTS negocio_gastos_nuevo;

  RAISE NOTICE '✅ negocio_gastos consolidado';
END $$;

-- Eliminar es_nuevo si existe (es temporal)
ALTER TABLE solicitudes DROP COLUMN IF EXISTS es_nuevo;

\echo ''
\echo '✅ Sufijos _nuevo eliminados'
\echo ''

-- VERIFICACIÓN FINAL
\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  VERIFICACIÓN FINAL                                        ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

-- Verificar que NO existan columnas en camelCase
SELECT
  '❌ ERROR: Aún hay camelCase' as status,
  column_name
FROM information_schema.columns
WHERE table_name = 'solicitudes'
  AND column_name ~ '[A-Z]'
ORDER BY column_name;

-- Si no hay resultados, mostrar éxito
DO $$
DECLARE
  camel_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO camel_count
  FROM information_schema.columns
  WHERE table_name = 'solicitudes' AND column_name ~ '[A-Z]';

  IF camel_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ ¡ÉXITO! Ya no hay columnas en camelCase';
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '❌ Aún quedan % columnas en camelCase', camel_count;
    RAISE NOTICE '';
  END IF;
END $$;

\echo ''
\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  LISTO PARA CONFIRMAR                                      ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''
\echo '⚠️  IMPORTANTE:'
\echo '   - Revisa los cambios arriba'
\echo '   - Si todo se ve bien, escribe: COMMIT;'
\echo '   - Si algo salió mal, escribe: ROLLBACK;'
\echo ''
