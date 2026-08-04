const { exec } = require('child_process');
const { Pool } = require('pg');
const http = require('http');
const util = require('util');
const execPromise = util.promisify(exec);

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: 'crelealtad',
});

let serverProcess = null;

async function ejecutarComando(comando, descripcion, opciones = {}) {
  console.log(`\n⏳ ${descripcion}...`);
  try {
    const { stdout, stderr } = await execPromise(comando, {
      cwd: opciones.cwd || process.cwd(),
      timeout: opciones.timeout || 60000,
    });

    if (stderr && !opciones.ignoreStderr) {
      console.log(`⚠️  Advertencias:\n${stderr.substring(0, 500)}`);
    }

    if (stdout) {
      console.log(`✅ ${descripcion} - OK`);
      if (opciones.showOutput) {
        console.log(stdout.substring(0, 1000));
      }
    }

    return { success: true, stdout, stderr };
  } catch (error) {
    console.log(`❌ ${descripcion} - ERROR`);
    console.log(`   ${error.message.substring(0, 500)}`);
    return { success: false, error: error.message };
  }
}

async function verificarBaseDatos() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PASO 1: VERIFICACIÓN DE BASE DE DATOS                    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const client = await pool.connect();

  try {
    // Verificar conexión
    const dbInfo = await client.query('SELECT current_database(), version()');
    console.log(`\n✅ Conectado a: ${dbInfo.rows[0].current_database}`);

    // Contar tablas
    const tablas = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    console.log(`✅ Tablas encontradas: ${tablas.rows[0].count}`);

    // Verificar tabla solicitudes
    const solicitudes = await client.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE table_name = 'solicitudes'
      AND column_name ~ '[A-Z]'
    `);

    if (solicitudes.rows[0].count === 0) {
      console.log('✅ Tabla solicitudes: 100% snake_case');
    } else {
      console.log(`❌ Tabla solicitudes: ${solicitudes.rows[0].count} columnas en camelCase`);
    }

    client.release();
    return true;
  } catch (error) {
    console.log('❌ Error de base de datos:', error.message);
    client.release();
    return false;
  }
}

async function verificarDependencias() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PASO 2: VERIFICACIÓN DE DEPENDENCIAS                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const result = await ejecutarComando(
    'npm list --depth=0',
    'Verificar dependencias instaladas',
    { cwd: 'apps/api', ignoreStderr: true }
  );

  return result.success;
}

async function compilarProyecto() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PASO 3: COMPILACIÓN DEL PROYECTO                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const result = await ejecutarComando(
    'npm run build',
    'Compilar proyecto TypeScript',
    { cwd: 'apps/api', timeout: 120000 }
  );

  return result.success;
}

async function iniciarServidor() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PASO 4: INICIANDO SERVIDOR                               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  return new Promise((resolve) => {
    console.log('\n⏳ Iniciando servidor (esto puede tomar 10-15 segundos)...\n');

    const { spawn } = require('child_process');

    serverProcess = spawn('npm', ['run', 'start:dev'], {
      cwd: 'apps/api',
      shell: true,
      detached: false,
    });

    let serverStarted = false;
    let outputBuffer = '';

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;

      // Mostrar output importante
      if (output.includes('Nest application successfully started') ||
          output.includes('Application is running on')) {
        console.log('✅ Servidor iniciado correctamente');
        serverStarted = true;
        setTimeout(() => resolve(true), 2000);
      }

      if (output.includes('ERROR') || output.includes('Error')) {
        console.log('❌ Error detectado:');
        console.log(output.substring(0, 500));
      }

      // Mostrar líneas importantes
      const lines = output.split('\n');
      lines.forEach(line => {
        if (line.includes('Mapped') ||
            line.includes('Controller') ||
            line.includes('listening') ||
            line.includes('Database connected')) {
          console.log(`   ${line.trim()}`);
        }
      });
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('ERROR') || error.includes('Error')) {
        console.log('❌ Error:', error.substring(0, 300));
      }
    });

    serverProcess.on('error', (error) => {
      console.log('❌ Error al iniciar servidor:', error.message);
      resolve(false);
    });

    // Timeout de 30 segundos
    setTimeout(() => {
      if (!serverStarted) {
        console.log('\n⚠️  Servidor tomó más de 30s, pero puede estar iniciando...');
        console.log('   Intentando verificar conexión...\n');
        resolve(true); // Continuamos para hacer el health check
      }
    }, 30000);
  });
}

async function probarEndpoints() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  PASO 5: PROBANDO ENDPOINTS DE LA API                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const endpoints = [
    { path: '/', name: 'Health Check' },
    { path: '/api/personas', name: 'Personas' },
    { path: '/api/grupos', name: 'Grupos' },
    { path: '/api/expedientes', name: 'Expedientes' },
    { path: '/api/integrantes', name: 'Integrantes' },
    { path: '/api/solicitudes', name: 'Solicitudes (CRÍTICO)' },
  ];

  const resultados = [];

  for (const endpoint of endpoints) {
    await new Promise(resolve => {
      const req = http.get(`http://localhost:3000${endpoint.path}`, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`✅ ${endpoint.name}: OK (${res.statusCode})`);
            resultados.push({ endpoint: endpoint.name, success: true, status: res.statusCode });
          } else if (res.statusCode === 404) {
            console.log(`⚠️  ${endpoint.name}: No encontrado (${res.statusCode})`);
            resultados.push({ endpoint: endpoint.name, success: false, status: res.statusCode });
          } else {
            console.log(`⚠️  ${endpoint.name}: ${res.statusCode}`);
            resultados.push({ endpoint: endpoint.name, success: false, status: res.statusCode });
          }
          resolve();
        });
      });

      req.on('error', (error) => {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
        resultados.push({ endpoint: endpoint.name, success: false, error: error.message });
        resolve();
      });

      req.setTimeout(5000, () => {
        req.destroy();
        console.log(`⏱️  ${endpoint.name}: Timeout`);
        resultados.push({ endpoint: endpoint.name, success: false, error: 'Timeout' });
        resolve();
      });
    });

    // Pequeña pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return resultados;
}

async function detenerServidor() {
  if (serverProcess) {
    console.log('\n⏳ Deteniendo servidor...');
    serverProcess.kill();
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Servidor detenido');
  }
}

async function ejecutarVerificacionCompleta() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║  🔍 VERIFICACIÓN COMPLETA DE CRELEALTAD CORE               ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const inicio = Date.now();

  try {
    // Paso 1: Base de datos
    const dbOk = await verificarBaseDatos();
    if (!dbOk) {
      console.log('\n❌ Error crítico en base de datos. Deteniendo verificación.');
      return;
    }

    // Paso 2: Dependencias
    await verificarDependencias();

    // Paso 3: Compilación
    const compilacionOk = await compilarProyecto();
    if (!compilacionOk) {
      console.log('\n⚠️  Error en compilación, pero continuando...');
    }

    // Paso 4: Iniciar servidor
    const servidorOk = await iniciarServidor();

    if (servidorOk) {
      // Dar tiempo al servidor para estabilizarse
      console.log('\n⏳ Esperando que el servidor se estabilice (5s)...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Paso 5: Probar endpoints
      const resultados = await probarEndpoints();

      // Resumen final
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║  RESUMEN FINAL                                             ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');

      const exitosos = resultados.filter(r => r.success).length;
      const total = resultados.length;

      console.log(`📊 Endpoints probados: ${exitosos}/${total} exitosos\n`);

      const solicitudesOk = resultados.find(r => r.endpoint.includes('Solicitudes'));
      if (solicitudesOk && solicitudesOk.success) {
        console.log('🎉 ✅ ENDPOINT SOLICITUDES FUNCIONANDO - ¡CORRECCIÓN EXITOSA!');
      } else {
        console.log('⚠️  Endpoint de solicitudes tuvo problemas');
      }

      const duracion = Math.round((Date.now() - inicio) / 1000);
      console.log(`\n⏱️  Tiempo total: ${duracion} segundos\n`);

      console.log('📝 Recomendaciones:');
      console.log('   1. Revisar logs del servidor para más detalles');
      console.log('   2. Ejecutar tests: npm run test');
      console.log('   3. Verificar en navegador: http://localhost:3000\n');

    } else {
      console.log('\n❌ No se pudo iniciar el servidor correctamente');
    }

  } catch (error) {
    console.log('\n❌ Error durante verificación:', error.message);
  } finally {
    await detenerServidor();
    await pool.end();
    console.log('\n✅ Verificación completada\n');
    process.exit(0);
  }
}

// Ejecutar
ejecutarVerificacionCompleta();
