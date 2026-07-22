-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 5: VERIFICACIÓN FINAL
-- ============================================================

-- 1. Verificar que existan exactamente 20 tablas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verificar columnas críticas de solicitudes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'solicitudes'
ORDER BY ordinal_position;

-- 3. Verificar columnas de integrantes
SELECT column_name FROM information_schema.columns
WHERE table_name = 'integrantes'
ORDER BY ordinal_position;

-- 4. Verificar columnas de grupos
SELECT column_name FROM information_schema.columns
WHERE table_name = 'grupos'
ORDER BY ordinal_position;

-- 5. Verificar relaciones (foreign keys)
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS tabla_referenciada
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 6. Verificar datos semilla
SELECT nombre FROM roles;
SELECT nombre FROM sucursales;
SELECT nombre FROM zonas;
SELECT nombre FROM productos_credito;

-- 7. Contar registros por tabla
SELECT
  'grupos' as tabla, COUNT(*) as registros FROM grupos
UNION ALL
SELECT 'expedientes', COUNT(*) FROM expedientes
UNION ALL
SELECT 'integrantes', COUNT(*) FROM integrantes
UNION ALL
SELECT 'solicitudes', COUNT(*) FROM solicitudes
UNION ALL
SELECT 'personas', COUNT(*) FROM personas
UNION ALL
SELECT 'creditos', COUNT(*) FROM creditos
UNION ALL
SELECT 'roles', COUNT(*) FROM roles
UNION ALL
SELECT 'sucursales', COUNT(*) FROM sucursales
UNION ALL
SELECT 'zonas', COUNT(*) FROM zonas
UNION ALL
SELECT 'productos_credito', COUNT(*) FROM productos_credito;
