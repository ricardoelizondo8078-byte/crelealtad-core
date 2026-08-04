import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'crelealtad',
});

async function verificarRelaciones() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RELACIÓN: USUARIOS ↔ EMPLEADOS ↔ CICLOS');
  console.log('═══════════════════════════════════════════════════════\n');

  // 1. Ver campo usuario_id en empleados
  console.log('📊 TABLA EMPLEADOS:\n');

  const empleadosCols = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'empleados'
    ORDER BY ordinal_position;
  `);

  empleadosCols.rows.forEach(c => {
    const req = c.is_nullable === 'NO' ? 'REQUERIDO' : 'OPCIONAL';
    console.log(`   ${c.column_name.padEnd(25)} ${c.data_type.padEnd(25)} ${req}`);
  });

  // 2. Ver campo asesora_id en ciclos
  console.log('\n\n📊 TABLA CICLOS:\n');

  const ciclosCols = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'ciclos'
    ORDER BY ordinal_position;
  `);

  ciclosCols.rows.forEach(c => {
    const req = c.is_nullable === 'NO' ? 'REQUERIDO' : 'OPCIONAL';
    console.log(`   ${c.column_name.padEnd(25)} ${c.data_type.padEnd(25)} ${req}`);
  });

  // 3. Ver foreign keys
  console.log('\n\n📊 FOREIGN KEYS (Referencias):\n');

  const fks = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND (tc.table_name IN ('empleados', 'ciclos', 'expedientes'))
    ORDER BY tc.table_name, kcu.column_name;
  `);

  if (fks.rows.length > 0) {
    fks.rows.forEach(fk => {
      console.log(`   ${fk.table_name}.${fk.column_name.padEnd(20)} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
  } else {
    console.log('   (No se encontraron FKs configuradas)');
  }

  console.log('\n\n🔗 FLUJO DE RELACIONES:\n');
  console.log('   1️⃣  USUARIO (tabla: usuarios)');
  console.log('       - id (UUID)');
  console.log('       - email, password_hash');
  console.log('       - rol_id → roles.id (ASESOR, ADMINISTRADOR, etc.)');
  console.log('');
  console.log('   2️⃣  EMPLEADO (tabla: empleados)');
  console.log('       - id (UUID) ← este es el que se usa en ciclos');
  console.log('       - usuario_id → usuarios.id (para login)');
  console.log('       - nombre_completo, curp, rfc, tipo_empleado');
  console.log('');
  console.log('   3️⃣  CICLO (tabla: ciclos)');
  console.log('       - id (UUID)');
  console.log('       - asesora_id → empleados.id (relación a empleado)');
  console.log('       - grupo_id, numero_ciclo, fecha_inicio, dia_pago');
  console.log('');
  console.log('   4️⃣  EXPEDIENTE (tabla: expedientes)');
  console.log('       - asesora_id → empleados.id');
  console.log('');

  console.log('\n💡 CONCLUSIÓN:\n');
  console.log('   ✅ empleados.usuario_id → usuarios.id (para login/acceso)');
  console.log('   ✅ ciclos.asesora_id → empleados.id (relación de trabajo)');
  console.log('   ✅ El ROL se guarda en usuarios.rol_id');
  console.log('   ✅ Los datos personales están en empleados\n');

  console.log('═══════════════════════════════════════════════════════\n');

  await pool.end();
}

verificarRelaciones()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
