-- ============================================================
-- ANÁLISIS DE DISCREPANCIAS ENTRE SCHEMA SQL Y ENTIDADES TypeORM
-- CRELEALTAD CORE
-- ============================================================

\echo '========================================='
\echo 'ANÁLISIS DE ESQUEMA DE BASE DE DATOS'
\echo '========================================='
\echo ''

-- 1. VERIFICAR TABLA PERSONAS
\echo '1. ESTRUCTURA DE TABLA: personas'
\echo '-----------------------------------------'
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'personas'
ORDER BY ordinal_position;

\echo ''

-- 2. VERIFICAR TABLA GRUPOS
\echo '2. ESTRUCTURA DE TABLA: grupos'
\echo '-----------------------------------------'
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'grupos'
ORDER BY ordinal_position;

\echo ''

-- 3. VERIFICAR TABLA EXPEDIENTES
\echo '3. ESTRUCTURA DE TABLA: expedientes'
\echo '-----------------------------------------'
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'expedientes'
ORDER BY ordinal_position;

\echo ''

-- 4. VERIFICAR TABLA INTEGRANTES
\echo '4. ESTRUCTURA DE TABLA: integrantes'
\echo '-----------------------------------------'
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'integrantes'
ORDER BY ordinal_position;

\echo ''

-- 5. VERIFICAR TABLA SOLICITUDES
\echo '5. ESTRUCTURA DE TABLA: solicitudes'
\echo '-----------------------------------------'
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'solicitudes'
ORDER BY ordinal_position;

\echo ''

-- 6. VERIFICAR TABLA DOCUMENTOS
\echo '6. ESTRUCTURA DE TABLA: documentos'
\echo '-----------------------------------------'
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'documentos'
ORDER BY ordinal_position;

\echo ''

-- 7. VERIFICAR CONSTRAINTS Y FOREIGN KEYS
\echo '7. FOREIGN KEYS Y CONSTRAINTS'
\echo '-----------------------------------------'
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name IN ('personas', 'grupos', 'expedientes', 'integrantes', 'solicitudes', 'documentos')
  AND tc.constraint_type IN ('FOREIGN KEY', 'UNIQUE', 'PRIMARY KEY')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

\echo ''

-- 8. VERIFICAR ÍNDICES
\echo '8. ÍNDICES EN LAS TABLAS'
\echo '-----------------------------------------'
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('personas', 'grupos', 'expedientes', 'integrantes', 'solicitudes', 'documentos')
ORDER BY tablename, indexname;

\echo ''
\echo '========================================='
\echo 'FIN DEL ANÁLISIS'
\echo '========================================='
