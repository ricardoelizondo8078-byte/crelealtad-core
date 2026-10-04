import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS,
  database: process.env.DB_NAME || 'crelealtad',
});

// Nombres compuestos comunes en México que deben mantenerse juntos
const NOMBRES_COMPUESTOS = [
  'MARIA DE JESUS', 'MARIA DE LOURDES', 'MARIA DE LA LUZ', 'MARIA DEL CARMEN',
  'MARIA DE LOS ANGELES', 'MARIA GUADALUPE', 'MA GUADALUPE', 'JOSE LUIS',
  'JUAN CARLOS', 'MARIA ELENA', 'ANA MARIA', 'ROSA MARIA', 'MARIA TERESA',
  'MARIA ISABEL', 'MARIA LUISA', 'MARIA CRISTINA', 'MARIA FERNANDA',
  'JOSE ANTONIO', 'JOSE MANUEL', 'LUIS MIGUEL', 'CARLOS ALBERTO',
  'MARIA DEL ROSARIO', 'MARIA DEL PILAR', 'MARIA DE LAS MERCEDES'
];

// Partículas que pueden ir en nombres pero no son parte del nombre principal
const PARTICULAS = ['DE', 'DEL', 'DE LA', 'DE LAS', 'DE LOS', 'LA', 'LAS', 'LOS', 'SAN', 'SANTA'];

interface Persona {
  id: string;
  curp: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  apellido_pat: string;
  apellido_mat: string | null;
}

interface NombreCorregido {
  primer_nombre: string;
  segundo_nombre: string | null;
  apellido_pat: string;
  apellido_mat: string | null;
}

function normalizarTexto(texto: string | null): string {
  if (!texto) return '';
  return texto.trim().toUpperCase().replace(/\s+/g, ' ');
}

function corregirNombre(persona: Persona): NombreCorregido {
  const nombreCompleto = [
    persona.primer_nombre,
    persona.segundo_nombre,
    persona.apellido_pat,
    persona.apellido_mat
  ]
    .filter(p => p)
    .join(' ');

  const palabras = nombreCompleto.split(/\s+/).filter(p => p);

  // Caso 1: Manejar comas (error de formato)
  const nombreSinComas = palabras.map(p => p.replace(',', ' ')).join(' ').split(/\s+/).filter(p => p);

  // Caso 2: Detectar nombres compuestos al inicio
  let primerNombre = '';
  let segundoNombre = null;
  let indexApellidos = 0;

  // Buscar nombres compuestos conocidos
  for (const compuesto of NOMBRES_COMPUESTOS) {
    const palabrasCompuesto = compuesto.split(' ');
    const inicio = nombreSinComas.slice(0, palabrasCompuesto.length).join(' ');
    if (inicio === compuesto) {
      primerNombre = compuesto;
      indexApellidos = palabrasCompuesto.length;
      break;
    }
  }

  // Si no es nombre compuesto conocido
  if (!primerNombre) {
    primerNombre = nombreSinComas[0] || '';
    indexApellidos = 1;

    // Verificar si el siguiente es parte del nombre (no una partícula sola ni un apellido)
    if (nombreSinComas.length > indexApellidos) {
      const siguiente = nombreSinComas[indexApellidos];

      // Si el siguiente es una partícula (DE, DEL, etc.) seguida de otra palabra, es nombre compuesto
      if (PARTICULAS.includes(siguiente) && nombreSinComas.length > indexApellidos + 1) {
        const tercero = nombreSinComas[indexApellidos + 1];
        // "MARIA DE JESUS" - nombre compuesto
        // "TERESA DE JESUS CARRILLO" - "DE JESUS" es segundo nombre
        if (!esApellido(tercero, persona.curp)) {
          segundoNombre = [siguiente, tercero].join(' ');
          indexApellidos += 2;
        } else {
          // "LOPEZ DE LA GARZA" - DE LA es parte del apellido
          indexApellidos = 1;
        }
      }
      // Si no es partícula, verificar si es segundo nombre
      else if (!esApellido(siguiente, persona.curp) && !PARTICULAS.includes(siguiente)) {
        segundoNombre = siguiente;
        indexApellidos++;
      }
    }
  }

  // Caso 3: Extraer apellidos
  const apellidos = nombreSinComas.slice(indexApellidos);
  let apellidoPat = '';
  let apellidoMat = null;

  if (apellidos.length > 0) {
    // Manejar apellidos compuestos con partículas (DE LA, DEL, etc.)
    if (apellidos.length >= 2 && PARTICULAS.includes(apellidos[0])) {
      // "DE LA ROSA" o "DEL CARMEN"
      if (apellidos.length >= 3 && (apellidos[0] === 'DE' && apellidos[1] === 'LA')) {
        apellidoPat = apellidos.slice(0, 3).join(' ');
        apellidoMat = apellidos.slice(3).join(' ') || null;
      } else if (apellidos[0] === 'DEL') {
        apellidoPat = apellidos.slice(0, 2).join(' ');
        apellidoMat = apellidos.slice(2).join(' ') || null;
      } else {
        apellidoPat = apellidos[0];
        apellidoMat = apellidos.slice(1).join(' ') || null;
      }
    } else {
      // Apellidos normales
      apellidoPat = apellidos[0];

      if (apellidos.length > 1) {
        // Si el segundo apellido tiene partícula
        if (apellidos.length >= 3 && PARTICULAS.includes(apellidos[1])) {
          apellidoMat = apellidos.slice(1).join(' ');
        } else {
          apellidoMat = apellidos.slice(1).join(' ');
        }
      }
    }
  } else {
    // Si no hay apellidos después de los nombres, usar los originales
    apellidoPat = persona.apellido_pat;
    apellidoMat = persona.apellido_mat;
  }

  return {
    primer_nombre: primerNombre || persona.primer_nombre,
    segundo_nombre: segundoNombre,
    apellido_pat: apellidoPat || persona.apellido_pat,
    apellido_mat: apellidoMat,
  };
}

// Función auxiliar para determinar si una palabra es más probable que sea apellido
function esApellido(palabra: string, curp: string): boolean {
  if (!curp || curp.length < 4) return false;

  // El CURP contiene las primeras letras del apellido paterno en posiciones 0-1
  // y apellido materno en posición 2
  const inicialPatCURP = curp.substring(0, 2).toUpperCase();
  const inicialMatCURP = curp.charAt(2).toUpperCase();

  // Si la palabra empieza con las iniciales del apellido del CURP, probablemente es apellido
  if (palabra.startsWith(inicialPatCURP.charAt(0)) || palabra.startsWith(inicialMatCURP)) {
    return true;
  }

  return false;
}

async function analizarYCorregir() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ANÁLISIS Y CORRECCIÓN DE NOMBRES');
  console.log('═══════════════════════════════════════════════════════\n');

  // Obtener todas las personas
  const result = await pool.query<Persona>(`
    SELECT id, curp, primer_nombre, segundo_nombre, apellido_pat, apellido_mat
    FROM personas
    ORDER BY id
  `);

  const personas = result.rows;
  console.log(`📊 Total de personas a analizar: ${personas.length}\n`);

  const correcciones: Array<{
    id: string;
    curp: string;
    antes: string;
    despues: string;
    cambios: string[];
  }> = [];

  let procesados = 0;
  let conCambios = 0;

  for (const persona of personas) {
    const corregido = corregirNombre(persona);

    const cambios: string[] = [];

    if (normalizarTexto(persona.primer_nombre) !== normalizarTexto(corregido.primer_nombre)) {
      cambios.push(`primer_nombre: "${persona.primer_nombre}" → "${corregido.primer_nombre}"`);
    }
    if (normalizarTexto(persona.segundo_nombre) !== normalizarTexto(corregido.segundo_nombre)) {
      cambios.push(`segundo_nombre: "${persona.segundo_nombre}" → "${corregido.segundo_nombre}"`);
    }
    if (normalizarTexto(persona.apellido_pat) !== normalizarTexto(corregido.apellido_pat)) {
      cambios.push(`apellido_pat: "${persona.apellido_pat}" → "${corregido.apellido_pat}"`);
    }
    if (normalizarTexto(persona.apellido_mat) !== normalizarTexto(corregido.apellido_mat)) {
      cambios.push(`apellido_mat: "${persona.apellido_mat}" → "${corregido.apellido_mat}"`);
    }

    if (cambios.length > 0) {
      const antes = `${persona.primer_nombre} ${persona.segundo_nombre || ''} ${persona.apellido_pat} ${persona.apellido_mat || ''}`.trim();
      const despues = `${corregido.primer_nombre} ${corregido.segundo_nombre || ''} ${corregido.apellido_pat} ${corregido.apellido_mat || ''}`.trim();

      correcciones.push({
        id: persona.id,
        curp: persona.curp,
        antes,
        despues,
        cambios
      });

      conCambios++;
    }

    procesados++;
    if (procesados % 500 === 0) {
      console.log(`Procesados: ${procesados}/${personas.length}`);
    }
  }

  console.log(`\n✅ Análisis completado`);
  console.log(`   Total procesados: ${procesados}`);
  console.log(`   Con cambios: ${conCambios}`);
  console.log(`   Sin cambios: ${procesados - conCambios}\n`);

  // Mostrar muestra de correcciones
  console.log('📋 MUESTRA DE CORRECCIONES (primeras 50):');
  console.log('═'.repeat(100));

  correcciones.slice(0, 50).forEach((corr, idx) => {
    console.log(`\n${idx + 1}. CURP: ${corr.curp}`);
    console.log(`   ANTES:   ${corr.antes}`);
    console.log(`   DESPUÉS: ${corr.despues}`);
    corr.cambios.forEach(c => console.log(`   - ${c}`));
  });

  // Guardar reporte completo
  const fs = require('fs');
  const reportPath = 'data/logs/correcciones_nombres.json';
  fs.writeFileSync(reportPath, JSON.stringify(correcciones, null, 2));
  console.log(`\n📄 Reporte completo guardado en: ${reportPath}`);

  return { correcciones, total: personas.length };
}

async function ejecutarCorrecciones(correcciones: any[]) {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  EJECUTANDO CORRECCIONES EN BASE DE DATOS');
  console.log('═══════════════════════════════════════════════════════\n');

  let actualizados = 0;

  for (const corr of correcciones) {
    const persona = await pool.query<Persona>(
      'SELECT * FROM personas WHERE id = $1',
      [corr.id]
    );

    if (persona.rows.length === 0) continue;

    const corregido = corregirNombre(persona.rows[0]);

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
      corregido.primer_nombre,
      corregido.segundo_nombre,
      corregido.apellido_pat,
      corregido.apellido_mat,
      corr.id
    ]);

    actualizados++;

    if (actualizados % 100 === 0) {
      console.log(`Actualizados: ${actualizados}/${correcciones.length}`);
    }
  }

  console.log(`\n✅ Correcciones aplicadas: ${actualizados}`);
}

async function main() {
  try {
    const { correcciones, total } = await analizarYCorregir();

    if (correcciones.length === 0) {
      console.log('\n✅ No se encontraron correcciones necesarias');
      await pool.end();
      process.exit(0);
    }

    console.log(`\n⚠️  Se encontraron ${correcciones.length} registros con correcciones necesarias`);
    console.log('📊 Esto representa el', ((correcciones.length / total) * 100).toFixed(2), '% del total');

    // Por seguridad, solo mostrar análisis sin aplicar cambios
    console.log('\n⚠️  MODO ANÁLISIS - No se aplicaron cambios a la base de datos');
    console.log('Para aplicar las correcciones, edita el script y descomenta la línea de ejecución');

    // Descomentar la siguiente línea para aplicar las correcciones:
    // await ejecutarCorrecciones(correcciones);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
