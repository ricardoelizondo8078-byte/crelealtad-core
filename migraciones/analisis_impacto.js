const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n' + '='.repeat(80));
console.log('ANÁLISIS DE IMPACTO: Archivos que usan primer_nombre/segundo_nombre');
console.log('='.repeat(80) + '\n');

const archivos = [
  // Backend - Entidades
  'apps/api/src/personas/persona.entity.ts',
  'apps/api/src/solicitudes/entities/solicitud-datos-personales.entity.ts',
  'apps/api/src/solicitudes/solicitud.entity.ts',

  // Backend - Servicios
  'apps/api/src/solicitudes/solicitudes.service.ts',
  'apps/api/src/integrantes/integrantes.service.ts',
  'apps/api/src/expedientes/expedientes.service.ts',

  // Frontend - Pantallas
  'apps/mobile/src/features/solicitudes/SolicitudFormScreen.tsx',
  'apps/mobile/src/features/verificacion/IntegranteVerificacionScreen.tsx',

  // Frontend - Servicios
  'apps/mobile/src/modules/asesor/services/solicitudService.ts'
];

let totalOcurrencias = 0;

archivos.forEach(archivo => {
  const rutaCompleta = path.join('..', archivo);

  if (!fs.existsSync(rutaCompleta)) {
    console.log(`⚠️  ARCHIVO NO EXISTE: ${archivo}`);
    console.log('');
    return;
  }

  try {
    const contenido = fs.readFileSync(rutaCompleta, 'utf8');
    const lineas = contenido.split('\n');
    const matches = [];

    lineas.forEach((linea, index) => {
      if (linea.match(/primer_nombre|segundo_nombre/)) {
        matches.push({
          linea: index + 1,
          codigo: linea.trim()
        });
      }
    });

    if (matches.length > 0) {
      console.log(`📄 ${archivo}`);
      console.log(`   Ocurrencias: ${matches.length}`);
      console.log('');

      matches.slice(0, 5).forEach(m => {
        console.log(`   Línea ${m.linea}: ${m.codigo.substring(0, 80)}${m.codigo.length > 80 ? '...' : ''}`);
      });

      if (matches.length > 5) {
        console.log(`   ... y ${matches.length - 5} ocurrencias más`);
      }

      console.log('');
      totalOcurrencias += matches.length;
    }
  } catch (error) {
    console.log(`❌ ERROR leyendo ${archivo}: ${error.message}`);
    console.log('');
  }
});

console.log('='.repeat(80));
console.log(`TOTAL: ${totalOcurrencias} ocurrencias en ${archivos.length} archivos revisados`);
console.log('='.repeat(80));
console.log('');

console.log('⚠️  ADVERTENCIA:');
console.log('Si eliminas las columnas primer_nombre y segundo_nombre de la base de datos');
console.log('ANTES de actualizar estos archivos, la aplicación SE ROMPERÁ.');
console.log('');
