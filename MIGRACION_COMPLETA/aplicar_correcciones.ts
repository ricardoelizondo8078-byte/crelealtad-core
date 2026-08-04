import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'crelealtad',
});

async function aplicarCorrecciones() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  APLICANDO CORRECCIONES APROBADAS');
  console.log('═══════════════════════════════════════════════════════\n');

  // Leer archivo Excel
  const excelPath = 'data/logs/CORRECCIONES_PARA_REVISION.xlsx';
  console.log(`📂 Leyendo archivo: ${excelPath}`);

  const workbook = XLSX.readFile(excelPath);

  // Leer todas las hojas
  let correcciones: any[] = [];

  // Hoja 1: ALTA Confianza
  if (workbook.SheetNames.includes('ALTA Confianza')) {
    const ws = workbook.Sheets['ALTA Confianza'];
    const data = XLSX.utils.sheet_to_json(ws);
    correcciones = correcciones.concat(data);
    console.log(`   ✅ Hoja "ALTA Confianza": ${data.length} registros`);
  }

  // Hoja 2: Requieren Revisión
  if (workbook.SheetNames.includes('Requieren Revisión')) {
    const ws = workbook.Sheets['Requieren Revisión'];
    const data = XLSX.utils.sheet_to_json(ws);
    correcciones = correcciones.concat(data);
    console.log(`   ✅ Hoja "Requieren Revisión": ${data.length} registros`);
  }

  console.log(`\n📊 Total de correcciones cargadas: ${correcciones.length}\n`);

  // Filtrar solo las aprobadas
  const aprobadas = correcciones.filter(c => {
    const aprobar = String(c.aprobar || '').trim().toUpperCase();
    return aprobar === 'SI' || aprobar === 'S' || aprobar === 'YES' || aprobar === 'Y';
  });

  console.log(`📋 Correcciones aprobadas para aplicar: ${aprobadas.length}`);

  if (aprobadas.length === 0) {
    console.log('\n⚠️  No hay correcciones aprobadas para aplicar.');
    console.log('   Marca con "SI" en la columna "aprobar" las correcciones que quieres aplicar.\n');
    await pool.end();
    return;
  }

  // Confirmar con el usuario
  console.log(`\n⚠️  ADVERTENCIA: Se aplicarán ${aprobadas.length} correcciones a la base de datos.`);
  console.log('   Esto modificará los nombres en la tabla personas.\n');

  // Aplicar correcciones
  let aplicadas = 0;
  let errores = 0;

  console.log('🔧 Aplicando correcciones...\n');

  for (const corr of aprobadas) {
    try {
      await pool.query(`
        UPDATE personas
        SET
          primer_nombre = $1,
          segundo_nombre = $2,
          apellido_pat = $3,
          apellido_mat = $4,
          updated_at = NOW()
        WHERE id = $5
      `, [
        corr.primer_nombre_propuesto,
        corr.segundo_nombre_propuesto || null,
        corr.apellido_pat_propuesto,
        corr.apellido_mat_propuesto || null,
        corr.id
      ]);

      aplicadas++;

      if (aplicadas % 50 === 0) {
        console.log(`   Progreso: ${aplicadas}/${aprobadas.length}`);
      }

    } catch (error: any) {
      console.error(`❌ Error con ID ${corr.id} (${corr.curp}):`, error.message);
      errores++;
    }
  }

  console.log(`\n✅ Correcciones aplicadas:`);
  console.log(`   Exitosas: ${aplicadas}`);
  console.log(`   Errores: ${errores}`);

  // Verificar cambios
  console.log(`\n🔍 Verificando cambios...`);

  const verificacion = await pool.query(`
    SELECT COUNT(*) as total
    FROM personas
    WHERE id = ANY($1::uuid[])
  `, [aprobadas.map(c => c.id)]);

  console.log(`   Registros actualizados verificados: ${verificacion.rows[0].total}`);

  // Generar reporte de aplicación
  const reporte = {
    fecha: new Date().toISOString(),
    total_correcciones_archivo: correcciones.length,
    aprobadas: aprobadas.length,
    aplicadas,
    errores,
    detalles: aprobadas.map(c => ({
      id: c.id,
      curp: c.curp,
      antes: c.nombre_completo_actual,
      despues: c.nombre_completo_propuesto
    }))
  };

  const fs = require('fs');
  const reportePath = `data/logs/reporte_aplicacion_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));

  console.log(`\n📄 Reporte de aplicación guardado: ${reportePath}\n`);

  await pool.end();
}

aplicarCorrecciones()
  .then(() => {
    console.log('✅ Proceso completado exitosamente\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
