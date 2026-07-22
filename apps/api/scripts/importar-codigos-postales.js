const { Client } = require('pg');
const fetch = require('node-fetch');

const client = new Client({
  database: 'crelealtad',
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  host: 'localhost',
  port: 5432
});

// Rangos de códigos postales de Nuevo León
// 64000-64999: Monterrey y área metropolitana norte
// 65000-65999: Área metropolitana sur
// 66000-66999: Área metropolitana oriente
// 67000-67999: Resto de Nuevo León

async function importarCP(cp) {
  try {
    const url = `https://api-sepomex.hckdrk.mx/query/info_cp/${cp}`;
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data && data.response && data.response.asentamiento) {
      return {
        cp: data.response.cp,
        municipio: data.response.municipio,
        estado: data.response.estado,
        asentamientos: Array.isArray(data.response.asentamiento)
          ? data.response.asentamiento
          : [data.response.asentamiento]
      };
    }
  } catch (error) {
    // Ignorar errores individuales
  }

  return null;
}

async function main() {
  console.log('🚀 Iniciando importación de códigos postales de Nuevo León...\n');

  await client.connect();
  console.log('✅ Conectado a PostgreSQL\n');

  let totalInsertados = 0;
  let cpProcesados = 0;
  let cpValidos = 0;

  // Rangos de CPs de Nuevo León
  const rangos = [
    { inicio: 64000, fin: 64999, zona: 'Monterrey y ZMM Norte' },
    { inicio: 65000, fin: 65999, zona: 'ZMM Sur' },
    { inicio: 66000, fin: 66999, zona: 'ZMM Oriente' },
    { inicio: 67000, fin: 67999, zona: 'Resto de Nuevo León' }
  ];

  for (const rango of rangos) {
    console.log(`\n📍 Procesando rango ${rango.inicio}-${rango.fin} (${rango.zona})...`);

    for (let cp = rango.inicio; cp <= rango.fin; cp++) {
      const cpStr = cp.toString().padStart(5, '0');
      const data = await importarCP(cpStr);

      cpProcesados++;

      if (data && data.estado && data.estado.toLowerCase().includes('nuevo le')) {
        cpValidos++;

        for (const colonia of data.asentamientos) {
          try {
            await client.query(`
              INSERT INTO codigos_postales (codigo, colonia, municipio, estado)
              VALUES ($1, $2, $3, 'Nuevo León')
              ON CONFLICT DO NOTHING
            `, [data.cp, colonia, data.municipio || 'Sin municipio']);

            totalInsertados++;
          } catch (e) {
            // Ignorar errores de inserción
          }
        }

        // Mostrar progreso cada 50 CPs válidos
        if (cpValidos % 50 === 0) {
          console.log(`  ✓ Procesados ${cpValidos} CPs válidos - ${totalInsertados} colonias insertadas`);
        }
      }

      // Pequeña pausa para no saturar la API
      if (cpProcesados % 10 === 0) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('✅ IMPORTACIÓN COMPLETADA');
  console.log('='.repeat(60));
  console.log(`📊 CPs procesados: ${cpProcesados}`);
  console.log(`✓  CPs válidos de Nuevo León: ${cpValidos}`);
  console.log(`📍 Total de colonias insertadas: ${totalInsertados}`);
  console.log('='.repeat(60) + '\n');

  // Mostrar estadísticas
  console.log('📈 Estadísticas por municipio:\n');
  const stats = await client.query(`
    SELECT municipio, COUNT(*) as colonias
    FROM codigos_postales
    GROUP BY municipio
    ORDER BY colonias DESC
    LIMIT 20
  `);

  console.table(stats.rows);

  const total = await client.query('SELECT COUNT(*) as total FROM codigos_postales');
  console.log(`\n🎯 Total de registros en la base de datos: ${total.rows[0].total}\n`);

  await client.end();
  console.log('✅ Conexión cerrada\n');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
