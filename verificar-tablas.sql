-- ========================================
-- VERIFICACIÓN COMPLETA DE TABLAS
-- Base de datos: crelealtad
-- ========================================

-- 1. Confirmar base de datos actual
SELECT current_database() as "Base de Datos Actual";

-- 2. Contar total de tablas
SELECT COUNT(*) as "Total de Tablas"
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE';

-- 3. Listar todas las tablas
SELECT
    table_name as "Nombre de Tabla",
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = t.table_name) as "Columnas"
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 4. Verificar tablas principales del sistema
SELECT 'grupos' as tabla, COUNT(*) as registros FROM grupos
UNION ALL
SELECT 'expedientes', COUNT(*) FROM expedientes
UNION ALL
SELECT 'integrantes', COUNT(*) FROM integrantes
UNION ALL
SELECT 'solicitudes', COUNT(*) FROM solicitudes
UNION ALL
SELECT 'documentos', COUNT(*) FROM documentos
UNION ALL
SELECT 'personas', COUNT(*) FROM personas
UNION ALL
SELECT 'roles', COUNT(*) FROM roles
UNION ALL
SELECT 'productos_credito', COUNT(*) FROM productos_credito
UNION ALL
SELECT 'sucursales', COUNT(*) FROM sucursales
UNION ALL
SELECT 'zonas', COUNT(*) FROM zonas
ORDER BY tabla;

-- 5. Verificar estructura de tabla integrantes (renombrada de solicitantes)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'integrantes'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar estructura de tabla solicitudes (con 60+ columnas)
SELECT COUNT(*) as "Total columnas en solicitudes"
FROM information_schema.columns
WHERE table_name = 'solicitudes'
AND table_schema = 'public';

-- 7. Listar columnas de solicitudes con snake_case
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'solicitudes'
AND table_schema = 'public'
ORDER BY ordinal_position
LIMIT 20;
