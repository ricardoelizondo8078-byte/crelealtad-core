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
    console.log('✅ Conectado a PostgreSQL\n');

    const roles = [
      {
        nombre: 'ASESOR',
        descripcion: 'Asesor de campo - captura expedientes y documentos',
        permisos: JSON.stringify({
          modulos: ['documentacion', 'expedientes', 'solicitudes'],
          acciones: ['crear', 'leer', 'actualizar']
        })
      },
      {
        nombre: 'COORDINADOR',
        descripcion: 'Coordinador de sucursal - supervisa asesores',
        permisos: JSON.stringify({
          modulos: ['documentacion', 'expedientes', 'solicitudes', 'reportes'],
          acciones: ['crear', 'leer', 'actualizar', 'exportar']
        })
      },
      {
        nombre: 'GERENTE',
        descripcion: 'Gerente regional - gestión completa',
        permisos: JSON.stringify({
          modulos: ['*'],
          acciones: ['*']
        })
      }
    ];

    console.log('🔐 Creando roles faltantes...\n');

    for (const rol of roles) {
      const existing = await client.query('SELECT id FROM roles WHERE nombre = $1', [rol.nombre]);

      if (existing.rows.length > 0) {
        console.log(`   ⚪ Rol ${rol.nombre} ya existe`);
      } else {
        const id = generateUUID();
        await client.query(`
          INSERT INTO roles (id, nombre, descripcion, permisos, estado, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 'ACTIVO', NOW(), NOW())
        `, [id, rol.nombre, rol.descripcion, rol.permisos]);

        console.log(`   ✅ Rol ${rol.nombre} creado`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 ROLES DISPONIBLES:\n');

    const result = await client.query('SELECT nombre, descripcion, estado FROM roles ORDER BY nombre');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
})();
