-- ============================================================
-- CRELEALTAD CORE - Schema SQL v2.0
-- PARTE 10: CORREGIR NOMBRES DE COLUMNAS EN DOCUMENTOS
-- Convertir de camelCase a snake_case
-- ============================================================

-- Verificar estado actual de la tabla
\echo 'ANTES DE LA MIGRACIÓN:'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'documentos'
ORDER BY ordinal_position;

\echo ''
\echo 'APLICANDO CAMBIOS...'

-- Eliminar constraint de FK si existe (con nombre antiguo)
ALTER TABLE documentos DROP CONSTRAINT IF EXISTS documentos_solicitanteId_fkey;
ALTER TABLE documentos DROP CONSTRAINT IF EXISTS "documentos_solicitanteId_fkey";

-- Renombrar columnas de camelCase a snake_case
ALTER TABLE documentos RENAME COLUMN "solicitanteId" TO integrante_id;
ALTER TABLE documentos RENAME COLUMN "archivoBase64" TO archivo_base64;
ALTER TABLE documentos RENAME COLUMN "archivoNombre" TO archivo_nombre;
ALTER TABLE documentos RENAME COLUMN "fechaCarga" TO fecha_carga;
ALTER TABLE documentos RENAME COLUMN "createdAt" TO created_at;
ALTER TABLE documentos RENAME COLUMN "updatedAt" TO updated_at;

-- Agregar constraint de FK con nombre correcto
ALTER TABLE documentos
  ADD CONSTRAINT fk_documentos_integrante
  FOREIGN KEY (integrante_id) REFERENCES integrantes(id)
  ON DELETE CASCADE;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_documentos_integrante ON documentos(integrante_id);
CREATE INDEX IF NOT EXISTS idx_documentos_tipo ON documentos(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_estado ON documentos(estado);

\echo ''
\echo 'DESPUÉS DE LA MIGRACIÓN:'
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'documentos'
ORDER BY ordinal_position;

\echo ''
\echo '✅ Migración completada: documentos ahora usa snake_case'
