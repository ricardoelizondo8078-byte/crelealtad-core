const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad',
});

async function verificacionFinal() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  VERIFICACIÓN FINAL - ENTIDAD vs BASE DE DATOS            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();

  try {
    // Columnas críticas que fueron corregidas
    const columnasCorregidas = [
      'fecha_nac',           // antes: fechaNacimiento
      'estado_civil',        // antes: estadoCivil
      'nivel_estudio',       // antes: nivelEstudio
      'estado_nacimiento',   // antes: estado_nacimiento_nuevo
      'negocio_giro',        // antes: negocio_giro_nuevo
      'negocio_gastos',      // antes: negocio_gastos_nuevo
      'created_at',          // antes: createdAt
      'updated_at',          // antes: updatedAt
      'beneficiario_nombre', // antes: beneficiarioNombreCompleto
      'beneficiario_direccion', // antes: beneficiarioDireccion
    ];

    console.log('📋 Verificando columnas corregidas en la base de datos:\n');

    let todasExisten = true;

    for (const columna of columnasCorregidas) {
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'solicitudes'
        AND column_name = $1
      `, [columna]);

      if (result.rows.length > 0) {
        console.log(`  ✅ ${columna}`);
      } else {
        console.log(`  ❌ ${columna} - NO EXISTE`);
        todasExisten = false;
      }
    }

    console.log('\n' + '─'.repeat(60));

    // Verificar que NO existan las columnas antiguas
    console.log('\n📋 Verificando que columnas antiguas fueron eliminadas:\n');

    const columnasAntiguas = [
      'fechaNacimiento',
      'estadoCivil',
      'nivelEstudio',
      'estado_nacimiento_nuevo',
      'negocio_giro_nuevo',
      'negocio_gastos_nuevo',
      'createdAt',
      'updatedAt',
      'beneficiarioNombreCompleto',
      'beneficiarioDireccion',
    ];

    let todasEliminadas = true;

    for (const columna of columnasAntiguas) {
      const result = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'solicitudes'
        AND column_name = $1
      `, [columna]);

      if (result.rows.length === 0) {
        console.log(`  ✅ ${columna} - ELIMINADA`);
      } else {
        console.log(`  ❌ ${columna} - AÚN EXISTE (ERROR)`);
        todasEliminadas = false;
      }
    }

    console.log('\n' + '─'.repeat(60));

    // Verificar que NO haya camelCase
    console.log('\n📋 Verificando que NO existan columnas en camelCase:\n');

    const camelCaseCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      AND column_name ~ '[A-Z]'
      ORDER BY column_name
    `);

    if (camelCaseCheck.rows.length === 0) {
      console.log('  ✅ No hay columnas en camelCase');
    } else {
      console.log(`  ❌ Encontradas ${camelCaseCheck.rows.length} columnas en camelCase:`);
      camelCaseCheck.rows.forEach(row => console.log(`     - ${row.column_name}`));
    }

    console.log('\n' + '─'.repeat(60));

    // Resumen final
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  RESUMEN FINAL                                             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    if (todasExisten && todasEliminadas && camelCaseCheck.rows.length === 0) {
      console.log('  🎉 ¡PERFECTO! Base de datos 100% sincronizada');
      console.log('  ✅ Todas las columnas corregidas existen');
      console.log('  ✅ Todas las columnas antiguas fueron eliminadas');
      console.log('  ✅ No hay columnas en camelCase');
      console.log('\n  ✅ La entidad solicitud.entity.ts ahora coincide con la DB\n');
      console.log('  📝 Próximos pasos:');
      console.log('     1. Iniciar el servidor: npm run start:dev');
      console.log('     2. Verificar que no hay errores de TypeORM');
      console.log('     3. Probar los endpoints de solicitudes\n');
    } else {
      console.log('  ⚠️  Hay algunos problemas:');
      if (!todasExisten) console.log('     - Faltan algunas columnas corregidas');
      if (!todasEliminadas) console.log('     - Algunas columnas antiguas no fueron eliminadas');
      if (camelCaseCheck.rows.length > 0) console.log('     - Aún hay columnas en camelCase');
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificacionFinal();
