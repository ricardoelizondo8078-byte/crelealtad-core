const { Client } = require('./apps/api/node_modules/pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function checkUsers() {
  try {
    await client.connect();
    console.log('✓ Conectado a PostgreSQL\n');

    // Consultar usuarios
    const result = await client.query(`
      SELECT
        id,
        nombre,
        email,
        estado,
        rol_id,
        sucursal_id,
        ultimo_login,
        created_at,
        LENGTH(password_hash) as password_hash_length
      FROM usuarios
      ORDER BY nombre
    `);

    console.log('========================================');
    console.log('USUARIOS EN LA BASE DE DATOS');
    console.log('========================================\n');

    if (result.rows.length === 0) {
      console.log('❌ NO HAY USUARIOS EN LA BASE DE DATOS\n');
    } else {
      console.table(result.rows);
      console.log(`\nTotal de usuarios: ${result.rows.length}`);
      console.log(`Usuarios ACTIVOS: ${result.rows.filter(u => u.estado === 'ACTIVO').length}\n`);
    }

    // Verificar si hay contraseñas hasheadas
    const hasHashed = result.rows.filter(u => u.password_hash_length > 0);
    console.log(`Usuarios con password_hash: ${hasHashed.length}`);

    if (hasHashed.length > 0) {
      console.log('\n✅ Las contraseñas están hasheadas con bcrypt (longitud ~60 caracteres)');
    } else {
      console.log('\n⚠️  Ningún usuario tiene contraseña configurada');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
