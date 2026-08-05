/**
 * Script de prueba: Simula el guardado del PASO 1 desde el frontend
 */

const API_URL = 'http://localhost:3100';

// Helper para hacer requests con fetch
async function request(method, url, data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);
  const text = await response.text();

  let responseData = null;
  if (text) {
    try {
      responseData = JSON.parse(text);
    } catch (e) {
      responseData = text;
    }
  }

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status}`);
    error.response = {
      status: response.status,
      data: responseData,
    };
    throw error;
  }

  return { status: response.status, data: responseData };
}

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function main() {
  let token = null;
  let integranteId = null;

  try {
    // PASO 1: LOGIN
    log(colors.cyan, '\n========================================');
    log(colors.cyan, '📋 PASO 1: LOGIN');
    log(colors.cyan, '========================================\n');

    const loginResponse = await request('POST', `${API_URL}/auth/login`, {
      email: 'admin@crelealtad.com',
      password: process.env.DB_PASSWORD || process.env.DB_PASS,
    });

    token = loginResponse.data.token;
    log(colors.green, `✅ Login exitoso`);
    if (token) {
      log(colors.blue, `   Token: ${token.substring(0, 30)}...`);
    } else {
      log(colors.red, `   ⚠️  Token no encontrado en respuesta`);
      log(colors.blue, `   Respuesta completa: ${JSON.stringify(loginResponse.data, null, 2)}`);
    }

    // PASO 2: CREAR INTEGRANTE
    log(colors.cyan, '\n========================================');
    log(colors.cyan, '📋 PASO 2: CREAR INTEGRANTE');
    log(colors.cyan, '========================================\n');

    let grupoResponse = await request('GET', `${API_URL}/grupos`, null, token);

    let grupos = grupoResponse.data.data || grupoResponse.data;
    let expedienteId = null;

    if (!grupos || grupos.length === 0) {
      log(colors.yellow, '   ⚠️  No hay grupos, creando uno...');

      const createGrupoResponse = await request('POST', `${API_URL}/grupos`, {
        name: 'GRUPO PRUEBA DIAGNOSTICO',
        createdBy: 'test-script'
      }, token);

      expedienteId = createGrupoResponse.data.expedienteId || createGrupoResponse.data.id;
      log(colors.green, `   ✅ Grupo creado: ${expedienteId}`);
    } else {
      expedienteId = grupos[0].expedienteId || grupos[0].id;
    }
    log(colors.blue, `   Usando expediente: ${expedienteId}`);

    const createIntegrantePayload = {
      expedienteId: expedienteId,
      nombres: 'MARÍA DEL SOCORRO',
      apellidoPaterno: 'GARCÍA',
      apellidoMaterno: 'LÓPEZ',
      telefono: '1234567890',
      montoSolicitado: 5000,
    };

    log(colors.blue, '\n   Datos del integrante:');
    log(colors.blue, `   ${JSON.stringify(createIntegrantePayload, null, 2)}`);

    const createIntegranteResponse = await request(
      'POST',
      `${API_URL}/integrantes`,
      createIntegrantePayload,
      token
    );

    integranteId = createIntegranteResponse.data.id;
    log(colors.green, `\n✅ Integrante creado: ${integranteId}`);
    log(colors.blue, `   Respuesta completa:`);
    log(colors.blue, `   ${JSON.stringify(createIntegranteResponse.data, null, 2)}`);

    // PASO 3: GUARDAR PASO 1 (PATCH /integrantes)
    log(colors.cyan, '\n========================================');
    log(colors.cyan, '📋 PASO 3: GUARDAR PASO 1 (PATCH /integrantes)');
    log(colors.cyan, '========================================\n');

    const integranteData = {
      nombres: 'MARÍA DEL SOCORRO',
      apellido_pat: 'GARCÍA',
      apellido_mat: 'LÓPEZ',
      nombre: 'MARÍA DEL SOCORRO GARCÍA LÓPEZ',
      telefono: '1234567890',
      telefonoSecundario: null,
      montoSolicitado: 5000,
    };

    log(colors.blue, '   PATCH /integrantes - Payload:');
    log(colors.blue, `   ${JSON.stringify(integranteData, null, 2)}`);

    const patchIntegranteResponse = await request(
      'PATCH',
      `${API_URL}/integrantes/${integranteId}`,
      integranteData,
      token
    );

    log(colors.green, `\n✅ PATCH /integrantes - Status: ${patchIntegranteResponse.status}`);
    log(colors.blue, `   Respuesta:`);
    log(colors.blue, `   ${JSON.stringify(patchIntegranteResponse.data, null, 2)}`);

    // PASO 4: GUARDAR SOLICITUD (PATCH /solicitudes)
    log(colors.cyan, '\n========================================');
    log(colors.cyan, '📋 PASO 4: GUARDAR SOLICITUD (PATCH /solicitudes)');
    log(colors.cyan, '========================================\n');

    const solicitudData = {
      nombres: 'MARÍA DEL SOCORRO',
      apellido_pat: 'GARCÍA',
      apellido_mat: 'LÓPEZ',
      fecha_nac: '1985-01-15',
      curp: 'GAML850115MNLRPR01',
      genero: 'FEMENINO',
      estado_civil: 'CASADA',
      ocupacion: 'COMERCIANTE',
      nivel_estudio: 'PRIMARIA',
      nacionalidad: 'MEXICANA',
      estado_nacimiento: 'NUEVO LEÓN',
    };

    log(colors.blue, '   Intentando PATCH /solicitudes/integrante/...');

    try {
      const patchSolicitudResponse = await request(
        'PATCH',
        `${API_URL}/solicitudes/integrante/${integranteId}`,
        solicitudData,
        token
      );

      log(colors.green, `\n✅ PATCH /solicitudes - Status: ${patchSolicitudResponse.status}`);
      log(colors.blue, `   Respuesta:`);
      log(colors.blue, `   ${JSON.stringify(patchSolicitudResponse.data, null, 2)}`);
    } catch (patchError) {
      if (patchError.response && patchError.response.status === 404) {
        log(colors.yellow, '\n⚠️  404 - No existe solicitud, creando con POST...');

        const postSolicitudResponse = await request(
          'POST',
          `${API_URL}/solicitudes`,
          {
            integrante_id: integranteId,
            ...solicitudData,
          },
          token
        );

        log(colors.green, `\n✅ POST /solicitudes - Status: ${postSolicitudResponse.status}`);
        log(colors.blue, `   Respuesta:`);
        log(colors.blue, `   ${JSON.stringify(postSolicitudResponse.data, null, 2)}`);
      } else {
        throw patchError;
      }
    }

    // PASO 5: VERIFICAR
    log(colors.cyan, '\n========================================');
    log(colors.cyan, '📋 PASO 5: VERIFICAR DATOS GUARDADOS');
    log(colors.cyan, '========================================\n');

    const getIntegranteResponse = await request(
      'GET',
      `${API_URL}/integrantes/${integranteId}`,
      null,
      token
    );

    log(colors.blue, '   GET /integrantes - Respuesta:');
    log(colors.blue, `   ${JSON.stringify(getIntegranteResponse.data, null, 2)}`);

    const integrante = getIntegranteResponse.data;
    const checks = [
      { campo: 'nombres', esperado: 'MARÍA DEL SOCORRO', actual: integrante.nombres },
      { campo: 'apellido_pat', esperado: 'GARCÍA', actual: integrante.apellido_pat },
      { campo: 'apellido_mat', esperado: 'LÓPEZ', actual: integrante.apellido_mat },
      { campo: 'nombre (completo)', esperado: 'MARÍA DEL SOCORRO GARCÍA LÓPEZ', actual: integrante.nombre },
      { campo: 'telefono', esperado: '1234567890', actual: integrante.telefono },
      { campo: 'montoSolicitado', esperado: 5000, actual: integrante.montoSolicitado },
    ];

    log(colors.cyan, '\n   Verificación de campos:');
    let allPassed = true;
    checks.forEach((check) => {
      const passed = check.actual === check.esperado;
      const icon = passed ? '✅' : '❌';
      const color = passed ? colors.green : colors.red;
      log(color, `   ${icon} ${check.campo}: ${check.actual} ${passed ? '' : `(esperado: ${check.esperado})`}`);
      if (!passed) allPassed = false;
    });

    // RESUMEN FINAL
    log(colors.cyan, '\n========================================');
    log(colors.cyan, '📋 RESUMEN FINAL');
    log(colors.cyan, '========================================\n');

    if (allPassed) {
      log(colors.green, '✅ TODAS LAS VERIFICACIONES PASARON');
      log(colors.green, '   El flujo de guardado funciona correctamente.\n');
    } else {
      log(colors.red, '❌ ALGUNAS VERIFICACIONES FALLARON');
      log(colors.red, '   Revisar los campos marcados con ❌ arriba.\n');
    }

  } catch (error) {
    log(colors.red, '\n❌ ERROR DETECTADO:');
    log(colors.red, `   ${error.message}\n`);

    if (error.response) {
      log(colors.red, `   Status: ${error.response.status}`);
      log(colors.red, `   Data: ${JSON.stringify(error.response.data, null, 2)}`);

      if (error.response.status === 500) {
        log(colors.yellow, '\n⚠️  ERROR 500 - Stack trace del servidor:');
        if (error.response.data.stack) {
          log(colors.yellow, error.response.data.stack);
        }
      }
    }

    if (error.stack) {
      log(colors.yellow, '\n   Stack trace del cliente:');
      log(colors.yellow, error.stack);
    }

    process.exit(1);
  }
}

main();
