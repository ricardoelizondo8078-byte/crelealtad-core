-- ============================================================
-- DATOS DE PRUEBA - CRELEALTAD
-- ============================================================
-- Este script inserta usuarios de prueba para desarrollo
-- ============================================================

-- ============================================================
-- PASO 1: Verificar que ya existen los datos del seed
-- ============================================================
SELECT id, nombre FROM roles;
SELECT id, nombre FROM sucursales;
SELECT id, nombre FROM zonas;
SELECT id, nombre FROM productos_credito;

-- ============================================================
-- PASO 2: Crear usuario administrador
-- ============================================================
-- Obtener el id del rol ADMIN y sucursal Matriz primero
INSERT INTO usuarios (
  nombre,
  email,
  password_hash,
  rol_id,
  sucursal_id,
  estado
)
SELECT
  'Administrador CRELEALTAD',
  'admin@crelealtad.com',
  '$2b$10$placeholderHashParaPruebas000000000000000000000000000',
  r.id,
  s.id,
  'ACTIVO'
FROM roles r, sucursales s
WHERE r.nombre = 'ADMIN'
AND s.nombre = 'Matriz'
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- PASO 3: Crear 3 usuarios con rol ASESORA
-- ============================================================
INSERT INTO usuarios (nombre, email, password_hash, rol_id, sucursal_id, estado)
SELECT 'María González López',    'maria.gonzalez@crelealtad.com',
  '$2b$10$placeholderHashParaPruebas000000000000000000000000000',
  r.id, s.id, 'ACTIVO'
FROM roles r, sucursales s WHERE r.nombre = 'ASESORA' AND s.nombre = 'Matriz'
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (nombre, email, password_hash, rol_id, sucursal_id, estado)
SELECT 'Laura Martínez Sánchez',  'laura.martinez@crelealtad.com',
  '$2b$10$placeholderHashParaPruebas000000000000000000000000000',
  r.id, s.id, 'ACTIVO'
FROM roles r, sucursales s WHERE r.nombre = 'ASESORA' AND s.nombre = 'Matriz'
ON CONFLICT (email) DO NOTHING;

INSERT INTO usuarios (nombre, email, password_hash, rol_id, sucursal_id, estado)
SELECT 'Ana Rodríguez Flores',    'ana.rodriguez@crelealtad.com',
  '$2b$10$placeholderHashParaPruebas000000000000000000000000000',
  r.id, s.id, 'ACTIVO'
FROM roles r, sucursales s WHERE r.nombre = 'ASESORA' AND s.nombre = 'Matriz'
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- PASO 4: Crear los perfiles de asesora
-- ============================================================
INSERT INTO asesoras (usuario_id, zona_id, telefono, estado)
SELECT u.id, z.id, '81-1000-0001', 'ACTIVA'
FROM usuarios u, zonas z
WHERE u.email = 'maria.gonzalez@crelealtad.com'
AND z.nombre = 'Zona Centro'
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO asesoras (usuario_id, zona_id, telefono, estado)
SELECT u.id, z.id, '81-1000-0002', 'ACTIVA'
FROM usuarios u, zonas z
WHERE u.email = 'laura.martinez@crelealtad.com'
AND z.nombre = 'Zona Centro'
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO asesoras (usuario_id, zona_id, telefono, estado)
SELECT u.id, z.id, '81-1000-0003', 'ACTIVA'
FROM usuarios u, zonas z
WHERE u.email = 'ana.rodriguez@crelealtad.com'
AND z.nombre = 'Zona Centro'
ON CONFLICT (usuario_id) DO NOTHING;

-- ============================================================
-- PASO 5: Verificación final
-- ============================================================
SELECT
  u.nombre as usuario,
  r.nombre as rol,
  u.email,
  u.estado,
  a.telefono as tel_asesora,
  z.nombre as zona
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
LEFT JOIN asesoras a ON a.usuario_id = u.id
LEFT JOIN zonas z ON a.zona_id = z.id
ORDER BY r.nombre, u.nombre;
