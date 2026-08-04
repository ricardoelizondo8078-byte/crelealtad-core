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

async function migrarCiclos() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  MIGRANDO CICLOS DESDE EXCEL');
  console.log('═══════════════════════════════════════════════════════\n');

  // Leer archivo Excel
  const excelPath = 'data/logs/PLANTILLA_CICLOS_PARA_COMPLETAR.xlsx';
  console.log(`📂 Leyendo archivo: ${excelPath}\n`);

  if (!fs.existsSync(excelPath)) {
    console.error(`❌ Error: No se encuentra el archivo ${excelPath}`);
    process.exit(1);
  }

  const workbook = XLSX.readFile(excelPath);
  const ws = workbook.Sheets['CICLOS'];
  const ciclos = XLSX.utils.sheet_to_json(ws);

  console.log(`📊 Ciclos leídos del Excel: ${ciclos.length}\n`);

  // Validar datos requeridos
  console.log('🔍 Validando datos requeridos...');

  const erroresValidacion: string[] = [];
  const ciclosValidos: any[] = [];

  ciclos.forEach((ciclo: any, idx) => {
    const errores: string[] = [];

    // Validar campos requeridos
    if (!ciclo.grupo_id) errores.push('grupo_id requerido');
    if (!ciclo.numero_ciclo) errores.push('numero_ciclo requerido');
    if (!ciclo.tesorera_id) errores.push('tesorera_id requerido');
    if (!ciclo.asesora_id) errores.push('asesora_id requerido');
    if (!ciclo.fecha_inicio) errores.push('fecha_inicio requerido');
    if (!ciclo.dia_pago) errores.push('dia_pago requerido');

    if (errores.length > 0) {
      erroresValidacion.push(`Fila ${idx + 2} (${ciclo.grupo_nombre}): ${errores.join(', ')}`);
    } else {
      ciclosValidos.push(ciclo);
    }
  });

  if (erroresValidacion.length > 0) {
    console.log(`\n⚠️  Errores de validación encontrados (${erroresValidacion.length}):`);
    erroresValidacion.slice(0, 20).forEach(err => console.log(`   ❌ ${err}`));

    if (erroresValidacion.length > 20) {
      console.log(`   ... y ${erroresValidacion.length - 20} más`);
    }

    console.log(`\n❌ Se encontraron ${erroresValidacion.length} ciclos con datos faltantes.`);
    console.log('   Por favor completa los campos requeridos en el Excel y vuelve a ejecutar.\n');

    await pool.end();
    process.exit(1);
  }

  console.log(`✅ Todos los ciclos tienen datos requeridos (${ciclosValidos.length})\n`);

  // Mostrar muestra de lo que se insertará
  console.log('📋 MUESTRA DE CICLOS A INSERTAR (primeros 5):');
  console.log('═'.repeat(100));

  ciclosValidos.slice(0, 5).forEach((c, idx) => {
    console.log(`\n${idx + 1}. ${c.grupo_nombre}`);
    console.log(`   Ciclo: ${c.numero_ciclo}`);
    console.log(`   Fecha inicio: ${c.fecha_inicio}`);
    console.log(`   Día pago: ${c.dia_pago}`);
    console.log(`   Tesorera: ${c.tesorera_nombre || c.tesorera_id}`);
    console.log(`   Estado: ${c.estado}`);
  });

  // Confirmar inserción
  console.log(`\n\n⚠️  ADVERTENCIA: Se insertarán ${ciclosValidos.length} ciclos en la base de datos.`);
  console.log('   Presiona Ctrl+C para cancelar en los próximos 3 segundos...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🔧 Insertando ciclos en base de datos...\n');

  let insertados = 0;
  let errores = 0;
  const erroresDetalle: any[] = [];

  for (const ciclo of ciclosValidos) {
    try {
      // Preparar valores
      const folio = ciclo.folio || null;
      const fechaFin = ciclo.fecha_fin || null;

      await pool.query(`
        INSERT INTO ciclos (
          folio,
          grupo_id,
          numero_ciclo,
          expediente_id,
          asesora_id,
          tesorera_id,
          fecha_inicio,
          fecha_fin,
          dia_pago,
          estado,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
        )
      `, [
        folio,
        ciclo.grupo_id,
        ciclo.numero_ciclo,
        ciclo.expediente_id,
        ciclo.asesora_id,
        ciclo.tesorera_id,
        ciclo.fecha_inicio,
        fechaFin,
        ciclo.dia_pago,
        ciclo.estado
      ]);

      insertados++;

      if (insertados % 50 === 0) {
        console.log(`   Progreso: ${insertados}/${ciclosValidos.length}`);
      }

    } catch (error: any) {
      console.error(`❌ Error con grupo "${ciclo.grupo_nombre}":`, error.message);
      errores++;
      erroresDetalle.push({
        grupo: ciclo.grupo_nombre,
        error: error.message
      });
    }
  }

  console.log(`\n✅ Ciclos insertados:`);
  console.log(`   Exitosos: ${insertados}`);
  console.log(`   Errores: ${errores}`);

  if (errores > 0) {
    console.log(`\n⚠️  Errores de inserción:`);
    erroresDetalle.forEach(e => {
      console.log(`   - ${e.grupo}: ${e.error}`);
    });
  }

  // Verificar en base de datos
  console.log(`\n🔍 Verificando ciclos en base de datos...`);

  const verificacion = await pool.query(`
    SELECT COUNT(*) as total FROM ciclos;
  `);

  console.log(`   Total de ciclos en DB: ${verificacion.rows[0].total}`);

  // Mostrar muestra
  const muestra = await pool.query(`
    SELECT
      c.folio,
      g.nombre as grupo_nombre,
      c.numero_ciclo,
      c.fecha_inicio,
      c.dia_pago,
      c.estado
    FROM ciclos c
    JOIN grupos g ON g.id = c.grupo_id
    ORDER BY g.nombre
    LIMIT 10;
  `);

  console.log(`\n📋 Muestra de ciclos insertados:`);
  console.log('═'.repeat(100));
  muestra.rows.forEach((row, idx) => {
    console.log(`${idx + 1}. ${row.grupo_nombre} - Ciclo ${row.numero_ciclo} - ${row.fecha_inicio} - ${row.dia_pago} - ${row.estado}`);
  });

  // Generar reporte
  const reporte = {
    fecha: new Date().toISOString(),
    total_en_excel: ciclos.length,
    total_validos: ciclosValidos.length,
    total_insertados: insertados,
    total_errores: errores,
    errores_validacion: erroresValidacion,
    errores_insercion: erroresDetalle
  };

  const reportePath = `data/logs/reporte_migracion_ciclos_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportePath, JSON.stringify(reporte, null, 2));

  console.log(`\n📄 Reporte guardado: ${reportePath}`);

  console.log(`\n📊 ESTADÍSTICAS FINALES:`);
  console.log(`   Total en Excel: ${ciclos.length}`);
  console.log(`   Válidos: ${ciclosValidos.length}`);
  console.log(`   Insertados: ${insertados}`);
  console.log(`   Errores: ${errores}`);
  console.log(`   Tasa de éxito: ${((insertados / ciclosValidos.length) * 100).toFixed(2)}%\n`);

  await pool.end();
}

migrarCiclos()
  .then(() => {
    console.log('✅ Proceso completado\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error fatal:', err);
    process.exit(1);
  });
