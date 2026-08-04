const fetch = require('node-fetch');

async function test() {
  const integranteId = '9edb4a65-f1c6-4b6f-b4b8-2de137ad54b1';

  console.log('Testing PATCH /solicitudes/integrante/:id');
  console.log('Integrante ID:', integranteId);

  const data = {
    primer_nombre: 'PRUEBA',
    apellido_pat: 'TEST',
    apellido_mat: 'GUARDADO',
    curp: 'PEGJ850101HDFRRN09',
    genero: 'MASCULINO'
  };

  console.log('\nDatos a enviar:', JSON.stringify(data, null, 2));

  try {
    const response = await fetch(`http://localhost:3000/solicitudes/integrante/${integranteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    console.log('\nStatus:', response.status);
    const text = await response.text();
    console.log('Response:', text);

    if (response.status === 500) {
      console.log('\n❌ ERROR 500 - Revisa los logs del API para ver el error detallado');
    }
  } catch (error) {
    console.error('\n❌ Error de conexión:', error.message);
  }
}

test();
