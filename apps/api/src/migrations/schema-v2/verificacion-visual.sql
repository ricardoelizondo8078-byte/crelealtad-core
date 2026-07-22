-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- VERIFICACIÓN VISUAL COMPLETA
-- ============================================================

-- 1. RESUMEN DE TABLAS
SELECT
  t.table_name as "Tabla",
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as "Columnas",
  (SELECT COUNT(*) FROM information_schema.table_constraints tc
   WHERE tc.table_name = t.table_name AND tc.constraint_type = 'FOREIGN KEY') as "FKs",
  pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as "Tamaño"
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 2. FOREIGN KEYS POR TABLA
SELECT
  tc.table_name AS "Tabla",
  kcu.column_name AS "Columna FK",
  ccu.table_name AS "→ Referencia"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- 3. COLUMNAS DE SOLICITUDES (las más importantes)
SELECT
  column_name as "Columna",
  data_type as "Tipo",
  CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as "Nullable"
FROM information_schema.columns
WHERE table_name = 'solicitudes'
ORDER BY ordinal_position;

-- 4. DATOS SEMILLA
SELECT 'roles' as tabla, COUNT(*)::text as registros FROM roles
UNION ALL
SELECT 'sucursales', COUNT(*)::text FROM sucursales
UNION ALL
SELECT 'zonas', COUNT(*)::text FROM zonas
UNION ALL
SELECT 'productos_credito', COUNT(*)::text FROM productos_credito
UNION ALL
SELECT 'usuarios', COUNT(*)::text FROM usuarios
UNION ALL
SELECT 'asesoras', COUNT(*)::text FROM asesoras
UNION ALL
SELECT 'personas', COUNT(*)::text FROM personas;

-- 5. DATOS DE PRUEBA (de la migración)
SELECT 'grupos' as tabla, COUNT(*)::text as registros FROM grupos
UNION ALL
SELECT 'expedientes', COUNT(*)::text FROM expedientes
UNION ALL
SELECT 'integrantes', COUNT(*)::text FROM integrantes
UNION ALL
SELECT 'solicitudes', COUNT(*)::text FROM solicitudes
UNION ALL
SELECT 'documentos', COUNT(*)::text FROM documentos;

-- 6. VERIFICAR ESTRUCTURA DE GRUPOS
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'grupos'
ORDER BY ordinal_position;

-- 7. VERIFICAR ESTRUCTURA DE INTEGRANTES
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'integrantes'
ORDER BY ordinal_position;

-- 8. VERIFICAR ÍNDICES
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 9. CONSTRAINTS ÚNICOS
SELECT
  tc.table_name AS "Tabla",
  kcu.column_name AS "Columna",
  tc.constraint_type AS "Tipo"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
ORDER BY tc.table_name, kcu.column_name;

-- 10. SAMPLE DE DATOS - GRUPOS
SELECT
  id,
  nombre,
  estado,
  zona_id,
  sucursal_id,
  fecha_inicio
FROM grupos
LIMIT 5;

-- 11. SAMPLE DE DATOS - EXPEDIENTES
SELECT
  id,
  grupo_id,
  estado,
  producto_id,
  asesora_id
FROM expedientes
LIMIT 5;

-- 12. SAMPLE DE DATOS - INTEGRANTES
SELECT
  id,
  expediente_id,
  persona_id,
  estado
FROM integrantes
LIMIT 5;

-- 13. SAMPLE DE DATOS - SOLICITUDES (mostrar solo columnas clave)
SELECT
  id,
  integrante_id,
  persona_id,
  expediente_id,
  grupo_id,
  curp,
  primer_nombre,
  apellido_pat
FROM solicitudes
LIMIT 5;

-- 14. ROLES DISPONIBLES
SELECT
  nombre,
  descripcion,
  estado
FROM roles
ORDER BY nombre;

-- 15. PRODUCTO DE CRÉDITO
SELECT
  nombre,
  tasa,
  precio_seguro,
  costo_apertura,
  retencion,
  num_semanas,
  monto_minimo,
  monto_maximo,
  min_integrantes,
  max_integrantes
FROM productos_credito;

-- 16. SUCURSAL Y ZONA
SELECT
  s.nombre as sucursal,
  z.nombre as zona
FROM sucursales s
LEFT JOIN zonas z ON z.sucursal_id = s.id;

-- 17. VERIFICAR QUE NO EXISTAN COLUMNAS VIEJAS EN INTEGRANTES
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'integrantes'
  AND column_name IN ('nombre', 'nombres', 'apellidoPaterno', 'apellidoMaterno',
                      'telefono', 'telefonoSecundario', 'montoSolicitado', 'seccionActual');
-- Debe devolver 0 filas

-- 18. VERIFICAR NUEVAS COLUMNAS EN GRUPOS
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'grupos'
  AND column_name IN ('folio', 'zona_id', 'sucursal_id', 'fecha_inicio');
-- Debe devolver 4 filas

-- 19. VERIFICAR NUEVAS COLUMNAS EN EXPEDIENTES
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'expedientes'
  AND column_name IN ('folio', 'producto_id', 'asesora_id', 'horario_visita',
                      'dias_visita', 'semana_cobro', 'observaciones');
-- Debe devolver 7 filas

-- 20. TOTAL DE REGISTROS EN TODAS LAS TABLAS
SELECT
  (SELECT COUNT(*) FROM grupos) as grupos,
  (SELECT COUNT(*) FROM expedientes) as expedientes,
  (SELECT COUNT(*) FROM integrantes) as integrantes,
  (SELECT COUNT(*) FROM solicitudes) as solicitudes,
  (SELECT COUNT(*) FROM personas) as personas,
  (SELECT COUNT(*) FROM creditos) as creditos,
  (SELECT COUNT(*) FROM calendario_pagos) as calendario_pagos,
  (SELECT COUNT(*) FROM pagos) as pagos,
  (SELECT COUNT(*) FROM mora) as mora,
  (SELECT COUNT(*) FROM reestructuras) as reestructuras,
  (SELECT COUNT(*) FROM ciclos) as ciclos,
  (SELECT COUNT(*) FROM roles) as roles,
  (SELECT COUNT(*) FROM usuarios) as usuarios,
  (SELECT COUNT(*) FROM asesoras) as asesoras,
  (SELECT COUNT(*) FROM sucursales) as sucursales,
  (SELECT COUNT(*) FROM zonas) as zonas,
  (SELECT COUNT(*) FROM productos_credito) as productos_credito,
  (SELECT COUNT(*) FROM caja_movimientos) as caja_movimientos,
  (SELECT COUNT(*) FROM audit_log) as audit_log,
  (SELECT COUNT(*) FROM documentos) as documentos,
  (SELECT COUNT(*) FROM codigos_postales) as codigos_postales;
