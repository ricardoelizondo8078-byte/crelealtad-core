import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

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
  console.log('  APLICANDO CORRECCIONES DESDE EXCEL');
  console.log('═══════════════════════════════════════════════════════\n');

  // Leer archivo Excel
  const excelPath = 'data/logs/CORRECCIONES_PARA_REVISION.xlsx';
  console.log(`📂 Leyendo archivo: ${excelPath}\n`);

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Error: No se encuentra el archivo ${excelPath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelPath);

  // Leer todas las hojas que contienen correcciones
  let todasLasCorrecciones: any[] = [];

  for (const sheetName of workbook.SheetNames) {
    if (sheetName === 'INSTRUCCIONES') continue;

    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws);

    console.log(`   📋 Hoja "${sheetName}": ${data.length} registros`);
    todasLasCorrecciones = todasLasCorrecciones.concat(data);
  }

  console.log(`\n📊 Total de registros cargados: ${todasLasCorrecciones.length}\n`);

  // Filtrar registros que tienen valores en las columnas H-K
  // Las columnas en el Excel son:
  // H: primer_nombre_propuesto
  // I: segundo_nombre_propuesto
  // J: apellido_pat_propuesto
  // K: apellido_mat_propuesto

  const correcciones = todasLasCorrecciones.filter(row => {
    // Si tiene ID y al menos primer_nombre_propuesto con un valor
    return row.id && row.primer_nombre_propuesto && row.primer_nombre_propuesto.trim().length > 0;
  });

  console.log(`📋 Registros con correcciones a aplicar: ${correcciones.length}`);

  if (correcciones.length === 0) {
    console.log('\n⚠️  No se encontraron correcciones para aplicar.');
    console.log('   Asegúrate de que las columnas H-K tengan valores.\n');
    await pool.end();
    return;
  }

  // Mostrar muestra de lo que se aplicará
  console.log('\n📋 MUESTRA DE CORRECCIONES (primeras 10):');
  console.log('═'.repeat(100));

  correcciones.slice(0, 10).forEach((c, idx) => {
    console.log(`\n${idx + 1}. CURP: ${c.curp}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   ACTUAL:    ${c.nombre_completo_actual || ''}`);
    console.log(`   APLICARÁ:  ${c.primer_nombre_propuesto} ${c.segundo_nombre_propuesto || ''} ${c.apellido_pat_propuesto} ${c.apellido_mat_propuesto || ''}`);
  });

  // Confirmar
  console.log(`\n⚠️  ADVERTENCIA: Se aplicarán ${correcciones.length} correcciones a la base de datos.`);
  console.log('   Presiona Ctrl+C para cancelar en los próximos 3 segundos...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🔧 Aplicando correcciones...\n');

  let aplicadas = 0;
  let errores = 0;
  const erroresDetalle: any[] = [];

  for (const corr of correcciones) {
    try {
      // Normalizar valores (vacío a null)
      const primerNombre = String(corr.primer_nombre_propuesto || '').trim();
      const segundoNombre = String(corr.segundo_nombre_propuesto || '').trim() || null;
      const apellidoPat = String(corr.apellido_pat_propuesto || '').trim();
      const apellidoMat = String(corr.apellido_mat_propuesto || '').trim() || null;

      if (!primerNombre || !apellidoPat) {
        throw new Error('Primer nombre y apellido paterno son requeridos');
      }

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
        primerNombre,
        segundoNombre,
        apellidoPat,
        apellidoMat,
        corr.id
      ]);

      aplicadas++;

      if (aplicadas % 50 === 0) {
        console.log(`   Progreso: ${aplicadas}/${correcciones.length}`);
      }

    } catch (error: any) {
      console.error(`❌ Error con ID ${corr.id} (${corr.curp}):`, error.message);
      errores++;
      erroresDetalle.push({
        id: corr.id,
        curp: corr.curp,
        error: error.message
      });
    }
  }

  console.log(`\n✅ Correcciones aplicadas:`);
  console.log(`   Exitosas: ${aplicadas}`);
  console.log(`   Errores: ${errores}`);

  if (errores > 0) {
    console.log(`\n⚠️  Errores encontrados:`);
    erroresDetalle.forEach(e => {
      console.log(`   - ID ${e.id} (${e.curp}): ${e.error}`);
    });
  }

  // Verificar cambios
  console.log(`\n🔍 Verificando cambios en base de datos...`);

  const verificacion = await pool.query(`
    SELECT COUNT(*) as total
    FROM personas
    WHERE id = ANY($1::uuid[])
  `, [correcciones.map(c => c.id)]);

  console.log(`   Registros verificados: ${verificacion.rows[0].total}`);

  // Mostrar muestra de registros actualizados
  const muestra = await pool.query(`
    SELECT curp, primer_nombre, segundo_nombre, apellido_pat, apellido_mat
    FROM personas
    WHERE id = ANY($1::uuid[])
    LIMIT 5
  `, [correcciones.map(c => c.id)]);

  console.log(`\n📋 Muestra de registros actualizados:`);
  console.log('═'.repeat(100));
  muestra.rows.forEach((row, idx) => {
    console.log(`${idx + 1}. ${row.curp}: ${row.primer_nombre} ${row.segundo_nombre || ''} ${row.apellido_pat} ${row.apellido_mat || ''}`);
  });

  // Generar reporte
  const reporte = {
    fecha: new Date().toISOString(),
    total_registros_excel: todasLasCorrecciones.length,
    total_aplicadas: aplicadas,
    total_errores: errores,
    errores_detalle: erroresDetalle,
    correcciones_aplicadas: correcciones.map(c => ({
      id: c.id,
      curp: c.curp,
      nombre_anterior: c.nombre_completo_actual,
      nombre_nuevo: `${c.primer_nombre_propuesto} ${c.segundo_nombre_propuesto || ''} ${c.apellido_pat_propuesto} ${c.apellido_mat_propuesto || ''}`.trim()
    }))
  };

  const reportePath = `data/logs/reporte_correcciones_aplicadas_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));

  console.log(`\n📄 Reporte completo guardado: ${reportePath}`);

  // Estadísticas finales
  console.log(`\n📊 ESTADÍSTICAS FINALES:`);
  console.log(`   Total en Excel: ${todasLasCorrecciones.length}`);
  console.log(`   Con correcciones: ${correcciones.length}`);
  console.log(`   Aplicadas exitosamente: ${aplicadas}`);
  console.log(`   Errores: ${errores}`);
  console.log(`   Tasa de éxito: ${((aplicadas / correcciones.length) * 100).toFixed(2)}%\n`);

  await pool.end();
}

aplicarCorrecciones()
  .then(() => {
    console.log('✅ Proceso completado exitosamente\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
