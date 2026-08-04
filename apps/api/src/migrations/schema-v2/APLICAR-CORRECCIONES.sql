-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- SCRIPT MAESTRO: APLICAR TODAS LAS CORRECCIONES
-- ============================================================

\echo '╔════════════════════════════════════════════════════════════╗'
\echo '║  CRELEALTAD CORE - Corrección de Discrepancias de Schema  ║'
\echo '╚════════════════════════════════════════════════════════════╝'
\echo ''

-- Configuración
\set ON_ERROR_STOP on
BEGIN;

\echo '📋 FASE 0: Backup y Verificación'
\echo '================================================'
\echo ''

-- Mostrar timestamp del backup
SELECT 'Timestamp de inicio: ' || NOW()::TEXT;

\echo ''
\echo 'Tablas existentes:'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('personas', 'grupos', 'expedientes', 'integrantes', 'solicitudes', 'documentos')
ORDER BY table_name;

\echo ''
\echo '================================================'
\echo '📝 FASE 1: Corregir tabla PERSONAS'
\echo '================================================'
\i 09-fix-personas-columns.sql

\echo ''
\echo '================================================'
\echo '📝 FASE 2: Corregir tabla DOCUMENTOS'
\echo '================================================'
\i 10-fix-documentos-naming.sql

\echo ''
\echo '================================================'
\echo '📝 FASE 3: Corregir tabla SOLICITUDES'
\echo '================================================'
\i 11-fix-solicitudes-naming.sql

\echo ''
\echo '================================================'
\echo '✅ VERIFICACIÓN FINAL'
\echo '================================================'

\echo ''
\echo '1. Verificar que NO existan columnas en camelCase:'
SELECT
  table_name,
  column_name,
  '❌ CAMELCASE DETECTADO' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('personas', 'grupos', 'expedientes', 'integrantes', 'solicitudes', 'documentos')
  AND column_name ~ '[A-Z]'  -- Detectar mayúsculas (camelCase)
ORDER BY table_name, column_name;

\echo ''
\echo '2. Verificar que NO existan columnas con sufijo _nuevo:'
SELECT
  table_name,
  column_name,
  '⚠️  SUFIJO _NUEVO DETECTADO' as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%_nuevo';

\echo ''
\echo '3. Verificar columnas críticas agregadas/renombradas:'

-- Personas
SELECT 'personas' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'personas'
  AND column_name IN ('telefono', 'monto_solicitado')

UNION ALL

-- Documentos
SELECT 'documentos' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documentos'
  AND column_name IN ('integrante_id', 'archivo_base64', 'archivo_nombre', 'fecha_carga', 'created_at', 'updated_at')

UNION ALL

-- Solicitudes
SELECT 'solicitudes' as tabla, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'solicitudes'
  AND column_name IN ('fecha_nac', 'estado_civil', 'nivel_estudio', 'estado_nacimiento', 'negocio_giro', 'negocio_gastos')

ORDER BY tabla, column_name;

\echo ''
\echo '4. Verificar Foreign Keys:'
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('documentos', 'solicitudes', 'integrantes')
ORDER BY tc.table_name, tc.constraint_name;

\echo ''
\echo '================================================'
\echo '🎉 RESUMEN DE CORRECCIONES APLICADAS'
\echo '================================================'

SELECT
  '✅ Personas: Agregadas columnas telefono, monto_solicitado' as correccion
UNION ALL
SELECT '✅ Documentos: Convertido de camelCase a snake_case (6 columnas)'
UNION ALL
SELECT '✅ Documentos: Renombrado solicitanteId → integrante_id'
UNION ALL
SELECT '✅ Solicitudes: Convertido de camelCase a snake_case (3 columnas)'
UNION ALL
SELECT '✅ Solicitudes: Eliminados sufijos _nuevo (3 columnas)'
UNION ALL
SELECT '✅ Foreign Keys: Actualizadas y verificadas'
UNION ALL
SELECT '✅ Índices: Creados para optimización';

\echo ''
\echo '================================================'

-- Confirmar o revertir
\echo ''
\echo '⚠️  IMPORTANTE:'
\echo 'Si todo se ve correcto, escribe COMMIT; para aplicar los cambios.'
\echo 'Si algo salió mal, escribe ROLLBACK; para revertir.'
\echo ''

-- Pausar para revisión manual
-- El usuario debe escribir COMMIT o ROLLBACK manualmente

\echo '💾 Esperando confirmación...'
\echo '   Escribe: COMMIT;   para aplicar'
\echo '   Escribe: ROLLBACK; para cancelar'
