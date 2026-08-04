const { Client } = require('pg');

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
    console.log('✅ Conectado a la base de datos local');

    // Buscar integrante JUAN CERO CERO
    const integrantes = await client.query(`
      SELECT i.id, i.estado, p.primer_nombre, p.apellido_pat, p.apellido_mat
      FROM integrantes i
      JOIN personas p ON i.persona_id = p.id
      WHERE p.primer_nombre = 'JUAN' AND p.apellido_pat = 'CERO'
    `);

    console.log('\n📋 Integrantes encontrados:');
    console.table(integrantes.rows);

    if (integrantes.rows.length > 0) {
      const integranteId = integrantes.rows[0].id;

      // Buscar solicitud
      const solicitud = await client.query(`
        SELECT
          integrante_id,
          doc_ine_ruta,
          doc_comprobante_ruta,
          doc_ine_beneficiario_ruta,
          doc_solicitud_firmada_ruta
        FROM solicitudes
        WHERE integrante_id = $1
      `, [integranteId]);

      console.log('\n📄 Documentos en solicitud:');
      console.table(solicitud.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
})();
