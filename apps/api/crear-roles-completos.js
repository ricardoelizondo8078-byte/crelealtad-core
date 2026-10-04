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
        nombre: 'ADMINISTRADOR',
        descripcion: 'Administrador del sistema - acceso total',
        permisos: JSON.stringify({
          modulos: ['*'],
          acciones: ['*']
        })
      },
      {
        nombre: 'ASESOR',
        descripcion: 'Asesor de campo - captura expedientes y documentos',
        permisos: JSON.stringify({
          modulos: ['documentacion', 'expedientes', 'solicitudes', 'verificacion'],
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
      },
      {
        nombre: 'RECOLECTOR',
        descripcion: 'Recolector de pagos en campo',
        permisos: JSON.stringify({
          modulos: ['cobranza', 'pagos'],
          acciones: ['crear', 'leer']
        })
      },
      {
        nombre: 'VERIFICADOR',
        descripcion: 'Verificador de documentación y datos',
        permisos: JSON.stringify({
          modulos: ['verificacion', 'expedientes', 'solicitudes'],
          acciones: ['leer', 'aprobar', 'rechazar']
        })
      },
      {
        nombre: 'COBRADOR',
        descripcion: 'Cobrador - gestión de cobranza',
        permisos: JSON.stringify({
          modulos: ['cobranza', 'pagos', 'mora'],
          acciones: ['crear', 'leer', 'actualizar']
        })
      },
      {
        nombre: 'DESEMBOLSADOR',
        descripcion: 'Desembolsador - entrega de créditos',
        permisos: JSON.stringify({
          modulos: ['desembolso', 'creditos', 'caja'],
          acciones: ['crear', 'leer', 'actualizar']
        })
      }
    ];

    console.log('🔐 Creando/actualizando roles completos...\n');

    for (const rol of roles) {
      const existing = await client.query('SELECT id FROM roles WHERE nombre = $1', [rol.nombre]);

      if (existing.rows.length > 0) {
        // Actualizar descripción y permisos
        await client.query(`
          UPDATE roles
          SET descripcion = $1, permisos = $2, updated_at = NOW()
          WHERE nombre = $3
        `, [rol.descripcion, rol.permisos, rol.nombre]);
        console.log(`   ✓ Rol ${rol.nombre} actualizado`);
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

    console.log('\n💡 TIPOS DE EMPLEADO DISPONIBLES:');
    console.log('   • ASESOR');
    console.log('   • COORDINADOR');
    console.log('   • GERENTE');
    console.log('   • RECOLECTOR');
    console.log('   • VERIFICADOR');
    console.log('   • COBRADOR');
    console.log('   • DESEMBOLSADOR');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
})();
