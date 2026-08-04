const bcrypt = require('bcrypt');
const { Client } = require('pg');
const crypto = require('crypto');

const generateUUID = () => crypto.randomUUID();

(async () => {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: process.env.DB_PASSWORD || process.env.DB_PASS,
    database: 'crelealtad'
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');

    // 1. Crear rol de administrador si no existe
    let rolId;
    const existingRol = await client.query(`SELECT id FROM roles WHERE nombre = 'ADMINISTRADOR' LIMIT 1`);
    if (existingRol.rows.length > 0) {
      rolId = existingRol.rows[0].id;
      console.log('✅ Rol ADMINISTRADOR ya existe');
    } else {
      rolId = generateUUID();
      await client.query(`
        INSERT INTO roles (id, nombre, descripcion, permisos, estado, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [rolId, 'ADMINISTRADOR', 'Rol con acceso total al sistema', '{}', 'ACTIVO']);
      console.log('✅ Rol ADMINISTRADOR creado');
    }

    // 2. Crear sucursal principal si no existe
    let sucursalId;
    const existingSucursal = await client.query(`SELECT id FROM sucursales WHERE nombre = 'MATRIZ' LIMIT 1`);
    if (existingSucursal.rows.length > 0) {
      sucursalId = existingSucursal.rows[0].id;
      console.log('✅ Sucursal MATRIZ ya existe');
    } else {
      sucursalId = generateUUID();
      await client.query(`
        INSERT INTO sucursales (id, nombre, direccion, telefono, estado, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [sucursalId, 'MATRIZ', 'Oficina Principal', '8181234567', 'ACTIVA']);
      console.log('✅ Sucursal MATRIZ creada');
    }

    const finalRolId = rolId;
    const finalSucursalId = sucursalId;

    // 4. Hashear el PIN de 4 dígitos (para el nuevo login)
    const pin = '1234';
    const passwordHash = await bcrypt.hash(pin, 10);

    // 5. Crear usuario administrador
    const userId = generateUUID();
    await client.query(`
      INSERT INTO usuarios (id, nombre, email, password_hash, rol_id, sucursal_id, estado, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          estado = EXCLUDED.estado,
          updated_at = NOW()
    `, [userId, 'Administrador', 'admin@crelealtad.com', passwordHash, finalRolId, finalSucursalId, 'ACTIVO']);

    console.log('✅ Usuario administrador creado');
    console.log('\n📋 Credenciales de acceso:');
    console.log('   Nombre: Administrador');
    console.log('   Email: admin@crelealtad.com');
    console.log('   PIN: 1234');
    console.log('   Estado: ACTIVO\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
})();
