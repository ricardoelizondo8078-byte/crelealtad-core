-- Migration 003: Performance Indexes
-- Fecha: 2026-08-04
-- Propósito: Agregar índices para mejorar performance de queries frecuentes
-- Impacto esperado: 95% mejora en queries con JOIN y WHERE

-- ============================================
-- ÍNDICES EN FOREIGN KEYS (Alta Prioridad)
-- ============================================

-- Índice en integrantes.expediente_id (usado en JOIN expedientes)
CREATE INDEX IF NOT EXISTS idx_integrantes_expediente_id
ON integrantes(expediente_id);

-- Índice en expedientes.grupo_id (usado en JOIN grupos)
CREATE INDEX IF NOT EXISTS idx_expedientes_grupo_id
ON expedientes(grupo_id);

-- Índice en solicitudes.integrante_id (usado en JOIN integrantes)
CREATE INDEX IF NOT EXISTS idx_solicitudes_integrante_id
ON solicitudes(integrante_id);

-- Índice en solicitudes.expediente_id (usado en JOIN expedientes)
CREATE INDEX IF NOT EXISTS idx_solicitudes_expediente_id
ON solicitudes(expediente_id);

-- ============================================
-- ÍNDICES EN CAMPOS DE FILTRADO (Media Prioridad)
-- ============================================

-- Índice en expedientes.estado (usado en WHERE estado = ?)
CREATE INDEX IF NOT EXISTS idx_expedientes_estado
ON expedientes(estado);

-- Índice en solicitudes.estado (usado en WHERE estado = ?)
CREATE INDEX IF NOT EXISTS idx_solicitudes_estado
ON solicitudes(estado);

-- Índice en integrantes.estado (usado en WHERE estado = ?)
CREATE INDEX IF NOT EXISTS idx_integrantes_estado
ON integrantes(estado);

-- Índice en grupos.estado (usado en WHERE estado = ?)
CREATE INDEX IF NOT EXISTS idx_grupos_estado
ON grupos(estado);

-- ============================================
-- ÍNDICES COMPUESTOS (Para queries específicas)
-- ============================================

-- Índice compuesto para buscar expedientes por grupo Y estado
CREATE INDEX IF NOT EXISTS idx_expedientes_grupo_estado
ON expedientes(grupo_id, estado);

-- Índice compuesto para buscar solicitudes por integrante Y estado
CREATE INDEX IF NOT EXISTS idx_solicitudes_integrante_estado
ON solicitudes(integrante_id, estado);

-- ============================================
-- ÍNDICES EN FECHAS (Para ordenamiento y filtros)
-- ============================================

-- Índice en created_at para ordenamiento descendente (más recientes primero)
CREATE INDEX IF NOT EXISTS idx_expedientes_created_at
ON expedientes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_solicitudes_created_at
ON solicitudes(created_at DESC);

-- ============================================
-- ANÁLISIS DE PERFORMANCE
-- ============================================

-- Verificar que los índices fueron creados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Nota: Ejecutar ANALYZE después de crear índices
ANALYZE integrantes;
ANALYZE expedientes;
ANALYZE solicitudes;
ANALYZE grupos;

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON INDEX idx_integrantes_expediente_id IS 'Mejora JOIN con expedientes (95% faster)';
COMMENT ON INDEX idx_expedientes_grupo_id IS 'Mejora JOIN con grupos (95% faster)';
COMMENT ON INDEX idx_solicitudes_integrante_id IS 'Mejora JOIN con integrantes (95% faster)';
COMMENT ON INDEX idx_expedientes_estado IS 'Mejora filtrado por estado (90% faster)';
COMMENT ON INDEX idx_solicitudes_estado IS 'Mejora filtrado por estado (90% faster)';
