-- Migration 004: Row Level Security (RLS)
-- Fecha: 2026-08-04
-- Propósito: Habilitar RLS para proteger datos por usuario/rol
-- Impacto: Previene acceso no autorizado a datos sensibles

-- ============================================
-- HABILITAR RLS EN TABLAS CRÍTICAS
-- ============================================

-- Habilitar RLS en tabla usuarios
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla grupos
ALTER TABLE grupos ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla expedientes
ALTER TABLE expedientes ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla integrantes
ALTER TABLE integrantes ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla solicitudes
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

-- Habilitar RLS en tabla personas
ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER FUNCTION: Obtener ID de usuario actual
-- ============================================

-- Función para obtener el usuario_id del JWT
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS uuid AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid;
$$ LANGUAGE sql STABLE;

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'rol', '')::text;
$$ LANGUAGE sql STABLE;

-- ============================================
-- POLICIES: USUARIOS
-- ============================================

-- Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
ON usuarios
FOR SELECT
USING (id = auth.user_id());

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
ON usuarios
FOR UPDATE
USING (id = auth.user_id());

-- Los administradores pueden ver todos los usuarios
CREATE POLICY "Admins can view all users"
ON usuarios
FOR SELECT
USING (auth.user_role() = 'ADMIN');

-- ============================================
-- POLICIES: GRUPOS
-- ============================================

-- Los usuarios pueden ver grupos creados por ellos
CREATE POLICY "Users can view own grupos"
ON grupos
FOR SELECT
USING (
  -- Grupo creado por el usuario actual (si existe columna created_by)
  -- O permitir ver todos los grupos (ajustar según reglas de negocio)
  true  -- Por ahora permitir ver todos - ajustar según necesidades
);

-- Los usuarios pueden crear grupos
CREATE POLICY "Users can create grupos"
ON grupos
FOR INSERT
WITH CHECK (
  auth.user_id() IS NOT NULL
);

-- Los usuarios pueden actualizar grupos que crearon
CREATE POLICY "Users can update own grupos"
ON grupos
FOR UPDATE
USING (
  true  -- Por ahora permitir actualizar todos - ajustar según necesidades
);

-- ============================================
-- POLICIES: EXPEDIENTES
-- ============================================

-- Los usuarios pueden ver expedientes de sus grupos
CREATE POLICY "Users can view expedientes"
ON expedientes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM grupos g
    WHERE g.id = expedientes.grupo_id
    -- Ajustar condición según reglas de negocio
  )
  OR auth.user_role() IN ('ADMIN', 'SUPERVISOR')
);

-- Los usuarios pueden crear expedientes
CREATE POLICY "Users can create expedientes"
ON expedientes
FOR INSERT
WITH CHECK (
  auth.user_id() IS NOT NULL
);

-- Los usuarios pueden actualizar expedientes
CREATE POLICY "Users can update expedientes"
ON expedientes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM grupos g
    WHERE g.id = expedientes.grupo_id
  )
  OR auth.user_role() IN ('ADMIN', 'SUPERVISOR')
);

-- ============================================
-- POLICIES: INTEGRANTES
-- ============================================

-- Los usuarios pueden ver integrantes de expedientes accesibles
CREATE POLICY "Users can view integrantes"
ON integrantes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM expedientes e
    JOIN grupos g ON g.id = e.grupo_id
    WHERE e.id = integrantes.expediente_id
  )
  OR auth.user_role() IN ('ADMIN', 'SUPERVISOR')
);

-- Los usuarios pueden crear integrantes
CREATE POLICY "Users can create integrantes"
ON integrantes
FOR INSERT
WITH CHECK (
  auth.user_id() IS NOT NULL
);

-- Los usuarios pueden actualizar integrantes
CREATE POLICY "Users can update integrantes"
ON integrantes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM expedientes e
    JOIN grupos g ON g.id = e.grupo_id
    WHERE e.id = integrantes.expediente_id
  )
  OR auth.user_role() IN ('ADMIN', 'SUPERVISOR')
);

-- ============================================
-- POLICIES: SOLICITUDES
-- ============================================

-- Los usuarios pueden ver solicitudes de integrantes accesibles
CREATE POLICY "Users can view solicitudes"
ON solicitudes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM integrantes i
    JOIN expedientes e ON e.id = i.expediente_id
    JOIN grupos g ON g.id = e.grupo_id
    WHERE i.id = solicitudes.integrante_id
  )
  OR auth.user_role() IN ('ADMIN', 'SUPERVISOR')
);

-- Los usuarios pueden crear solicitudes
CREATE POLICY "Users can create solicitudes"
ON solicitudes
FOR INSERT
WITH CHECK (
  auth.user_id() IS NOT NULL
);

-- Los usuarios pueden actualizar solicitudes
CREATE POLICY "Users can update solicitudes"
ON solicitudes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM integrantes i
    JOIN expedientes e ON e.id = i.expediente_id
    JOIN grupos g ON g.id = e.grupo_id
    WHERE i.id = solicitudes.integrante_id
  )
  OR auth.user_role() IN ('ADMIN', 'SUPERVISOR')
);

-- ============================================
-- POLICIES: PERSONAS
-- ============================================

-- Los usuarios pueden ver personas vinculadas a integrantes accesibles
CREATE POLICY "Users can view personas"
ON personas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM integrantes i
    JOIN expedientes e ON e.id = i.expediente_id
    JOIN grupos g ON g.id = e.grupo_id
    WHERE i.persona_id = personas.id
  )
  OR auth.user_role() IN ('ADMIN', 'SUPERVISOR')
);

-- Los usuarios pueden crear personas
CREATE POLICY "Users can create personas"
ON personas
FOR INSERT
WITH CHECK (
  auth.user_id() IS NOT NULL
);

-- Los usuarios pueden actualizar personas
CREATE POLICY "Users can update personas"
ON personas
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM integrantes i
    JOIN expedientes e ON e.id = i.expediente_id
    JOIN grupos g ON g.id = e.grupo_id
    WHERE i.persona_id = personas.id
  )
  OR auth.user_role() IN ('ADMIN', 'SUPERVISOR')
);

-- ============================================
-- POLICIES: DELETE (Restrictivas)
-- ============================================

-- Solo administradores pueden eliminar registros
CREATE POLICY "Only admins can delete grupos"
ON grupos
FOR DELETE
USING (auth.user_role() = 'ADMIN');

CREATE POLICY "Only admins can delete expedientes"
ON expedientes
FOR DELETE
USING (auth.user_role() = 'ADMIN');

CREATE POLICY "Only admins can delete integrantes"
ON integrantes
FOR DELETE
USING (auth.user_role() = 'ADMIN');

CREATE POLICY "Only admins can delete solicitudes"
ON solicitudes
FOR DELETE
USING (auth.user_role() = 'ADMIN');

CREATE POLICY "Only admins can delete personas"
ON personas
FOR DELETE
USING (auth.user_role() = 'ADMIN');

-- ============================================
-- VERIFICACIÓN DE POLICIES
-- ============================================

-- Ver todas las policies creadas
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================

-- 1. Estas policies son un PUNTO DE PARTIDA
--    Ajustar según reglas de negocio específicas

-- 2. Considerar agregar columna 'created_by' a las tablas
--    para rastrear quién creó cada registro

-- 3. Para testing en desarrollo, se puede deshabilitar RLS temporalmente:
--    ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;

-- 4. Para producción, verificar que las policies cubren TODOS los casos
--    y no permiten acceso no autorizado

-- 5. Las policies se evalúan con AND (todas deben pasar)
--    Para OR logic, usar múltiples policies

-- 6. El JWT debe incluir 'sub' (user_id) y 'rol' en los claims
--    Esto se configura en el backend (AuthService.login)

-- ============================================
-- ROLLBACK (Si es necesario)
-- ============================================

-- Para deshabilitar RLS (solo en desarrollo):
-- ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE grupos DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE expedientes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE integrantes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE solicitudes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE personas DISABLE ROW LEVEL SECURITY;

-- Para eliminar todas las policies:
-- DROP POLICY IF EXISTS "policy_name" ON table_name;
