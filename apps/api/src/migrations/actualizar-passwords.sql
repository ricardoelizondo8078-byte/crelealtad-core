-- Actualizar todos los usuarios con el hash real de bcrypt
-- Contraseña: Crelealtad2024!
UPDATE usuarios
SET password_hash = '$2b$10$khjUMGnw.hchbW80NcDgjOe9lOXNmdNnEb8I/mupgyTrYoz1vttZe'
WHERE password_hash LIKE '$2b$10$placeholder%';

-- Verificar que se actualizaron
SELECT nombre, email,
  LEFT(password_hash, 30) as hash_preview,
  CASE
    WHEN password_hash LIKE '%placeholder%' THEN 'PLACEHOLDER'
    ELSE 'HASH REAL'
  END as tipo_hash
FROM usuarios
ORDER BY nombre;
