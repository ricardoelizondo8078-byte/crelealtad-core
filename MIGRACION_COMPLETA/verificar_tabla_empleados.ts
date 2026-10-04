import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME || 'crelealtad',
});

async function verificarTablaEmpleados() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VERIFICANDO TABLA EMPLEADOS');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Ver estructura de la tabla
  console.log('📊 Estructura de la tabla empleados:\n');

  const estructura = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = 'empleados'
    ORDER BY ordinal_position;
  `);

  estructura.rows.forEach(col => {
    const requerido = col.is_nullable === 'NO' ? '(REQUERIDO)' : '(OPCIONAL)';
    console.log(`   ${col.column_name.padEnd(30)} ${col.data_type.padEnd(25)} ${requerido}`);
  });

  // 2. Contar registros
  const count = await pool.query(`
    SELECT COUNT(*) as total FROM empleados;
  `);

  console.log(`\n📈 Total de empleados en la tabla: ${count.rows[0].total}\n`);

  // 3. Si hay registros, mostrar muestra
  if (parseInt(count.rows[0].total) > 0) {
    const muestra = await pool.query(`
      SELECT
        id,
        nombre_completo,
        email,
        rol,
        estado,
        created_at
      FROM empleados
      LIMIT 20;
    `);

    console.log('📋 MUESTRA DE EMPLEADOS:\n');
    muestra.rows.forEach((emp, idx) => {
      console.log(`${String(idx + 1).padStart(3)}. ${emp.nombre_completo || '(sin nombre)'}`);
      console.log(`     ID: ${emp.id}`);
      console.log(`     Email: ${emp.email || 'N/A'}`);
      console.log(`     Rol: ${emp.rol || 'N/A'}`);
      console.log(`     Estado: ${emp.estado || 'N/A'}\n`);
    });

    // Ver si hay asesoras
    const asesoras = await pool.query(`
      SELECT COUNT(*) as total
      FROM empleados
      WHERE rol ILIKE '%asesor%' OR rol ILIKE '%promotor%';
    `);

    console.log(`👥 Empleados con rol de asesora/promotor: ${asesoras.rows[0].total}\n`);

  } else {
    console.log('❌ La tabla empleados está VACÍA\n');
    console.log('⚠️  NECESITAS CREAR EMPLEADOS PRIMERO\n');
    console.log('Tenemos los nombres de asesoras en el Excel original (campo LUPITA).');
    console.log('Podemos extraer esos nombres y crear registros de empleados.\n');
  }

  await pool.end();
}

verificarTablaEmpleados()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
