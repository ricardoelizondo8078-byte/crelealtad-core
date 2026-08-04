const fetch = require('node-fetch');

async function testGetIntegrante() {
  // Usar el ID que estás probando
  const integranteId = '3761c51b-7314-4999-8a37-b5bde354d821';

  try {
    console.log('🔍 Consultando integrante:', integranteId);
    console.log('URL:', `http://localhost:3000/integrantes/${integranteId}`);
    console.log('');

    const response = await fetch(`http://localhost:3000/integrantes/${integranteId}`);
    const data = await response.json();

    console.log('📦 RESPUESTA COMPLETA:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    console.log('🔍 CAMPOS CRÍTICOS:');
    console.log('  telefono:', data.telefono);
    console.log('  telefonoSecundario:', data.telefonoSecundario);
    console.log('  telefono_secundario:', data.telefono_secundario);
    console.log('  montoSolicitado:', data.montoSolicitado);
    console.log('  persona_id:', data.persona_id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGetIntegrante();
