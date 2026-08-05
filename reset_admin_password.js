const { Client } = require('./apps/api/node_modules/pg');
const bcrypt = require('./apps/api/node_modules/bcrypt');

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

    // Nueva contraseña para el administrador
    const newPassword = process.env.REQUIRED_SECRET;

    // Hashear la nueva contraseña
    console.log('🔐 Generando nuevo hash de contraseña...');
    const password_hash = await bcrypt.hash(newPassword, 10);

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

    console.log('\n========================================');
    console.log('CREDENCIALES PARA LOGIN:');
    console.log('========================================');
    console.log('Email: admin@crelealtad.com');
    console.log('Contraseña:', newPassword);
    console.log('========================================\n');
    console.log('💡 Usa estas credenciales para entrar a la app\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

resetAdminPassword();
