const { Client } = require('./apps/api/node_modules/pg');
const bcrypt = require('./apps/api/node_modules/bcrypt');

const initialTestPassword = process.env.INITIAL_TEST_PASSWORD;
if (!initialTestPassword) {
  throw new Error('INITIAL_TEST_PASSWORD es obligatorio');
}

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad'
});

async function createTestUser() {
  try {
    await client.connect();
    console.log('✓ Conectado a PostgreSQL\n');

    // Configuración del usuario de prueba
    const testUser = {
      email: 'test@crelealtad.com',
      password: initialTestPassword,
      nombre: 'USUARIO DE PRUEBA',
    };

    // Verificar si el usuario ya existe
    const existing = await client.query(
      'SELECT id, email FROM usuarios WHERE email = $1',
      [testUser.email]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  El usuario ya existe:', testUser.email);
      console.log('La credencial permanece únicamente en INITIAL_TEST_PASSWORD.');
      return;
    }

    // Obtener un rol válido (usar el primer rol ACTIVO que encuentre)
    const rolResult = await client.query(
      "SELECT id FROM roles WHERE estado = 'ACTIVO' LIMIT 1"
    );

    if (rolResult.rows.length === 0) {
      throw new Error('No hay roles activos en la base de datos');
    }

    const rol_id = rolResult.rows[0].id;

    // Obtener una sucursal válida (usar la primera ACTIVA)
    const sucursalResult = await client.query(
      "SELECT id FROM sucursales WHERE estado = 'ACTIVO' LIMIT 1"
    );

    if (sucursalResult.rows.length === 0) {
      throw new Error('No hay sucursales activas en la base de datos');
    }

    const sucursal_id = sucursalResult.rows[0].id;

    // Hashear la contraseña
    console.log('🔐 Hasheando contraseña...');
    const password_hash = await bcrypt.hash(testUser.password, 10);

    // Insertar el usuario
    const result = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_id, sucursal_id, estado, created_at)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVO', NOW())
       RETURNING id, nombre, email, estado`,
      [testUser.nombre, testUser.email, password_hash, rol_id, sucursal_id]
    );

    console.log('✅ Usuario creado exitosamente:\n');
    console.table(result.rows);

    console.log('La credencial permanece únicamente en INITIAL_TEST_PASSWORD.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

createTestUser();
