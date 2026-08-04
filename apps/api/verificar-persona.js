const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'crelealtad',
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
});

async function verificarPersona() {
  const client = await pool.connect();

  try {
    const personaId = 'f476819e-ec19-462c-95b8-bcc7563b6b47';

    console.log('🔍 Consultando persona:', personaId);
    console.log('');

    const result = await client.query(`
      SELECT id, primer_nombre, apellido_pat, telefono, telefono_secundario, monto_solicitado
      FROM personas
      WHERE id = $1
    `, [personaId]);

    if (result.rows.length === 0) {
      console.log('❌ Persona no encontrada');
    } else {
      console.log('📦 DATOS DE LA PERSONA:');
      console.log(JSON.stringify(result.rows[0], null, 2));
      console.log('');
      console.log('🔍 CAMPO CRÍTICO:');
      console.log('  telefono_secundario:', result.rows[0].telefono_secundario);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verificarPersona();
