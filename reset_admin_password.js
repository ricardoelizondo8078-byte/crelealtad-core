const { Client } = require('./apps/api/node_modules/pg');
const bcrypt = require('./apps/api/node_modules/bcrypt');

const newAdminPassword = process.env.NEW_ADMIN_PASSWORD;
if (!newAdminPassword) {
  throw new Error('NEW_ADMIN_PASSWORD es obligatorio');
}

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function resetAdminPassword() {
  try {
    await client.connect();
    console.log('✓ Conectado a PostgreSQL\n');

    // Hashear la nueva contraseña
    console.log('🔐 Generando nuevo hash de contraseña...');
    const password_hash = await bcrypt.hash(newAdminPassword, 10);

    // Actualizar el usuario ADMINISTRADOR
    const result = await client.query(
      `UPDATE usuarios
       SET password_hash = $1, ultimo_login = NULL
       WHERE email = 'admin@crelealtad.com'
       RETURNING id, nombre, email, estado`,
      [password_hash]
    );

    if (result.rows.length === 0) {
      console.log('❌ No se encontró el usuario admin@crelealtad.com\n');
      return;
    }

    console.log('✅ Contraseña actualizada exitosamente:\n');
    console.table(result.rows);

    console.log('La nueva credencial permanece únicamente en NEW_ADMIN_PASSWORD.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

resetAdminPassword();
