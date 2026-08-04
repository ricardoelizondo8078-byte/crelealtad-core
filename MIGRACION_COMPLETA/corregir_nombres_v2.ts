import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'crelealtad',
});

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
  razon: string;
}

// REGLA PRINCIPAL: El CURP define la estructura:
// Posición 0: Primera letra apellido paterno
// Posición 1: Primera vocal interna apellido paterno
// Posición 2: Primera letra apellido materno
// Posición 3: Primera letra primer nombre

function corregirNombrePorCURP(persona: Persona): NombreCorregido {
  // Unir todo el nombre completo y limpiar
  const nombreCompleto = [
    persona.primer_nombre,
    persona.segundo_nombre,
    persona.apellido_pat,
    persona.apellido_mat
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/,/g, ' ')  // Quitar comas
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim();

  const palabras = nombreCompleto.split(' ');

  if (!persona.curp || persona.curp.length < 4) {
    // Sin CURP, devolver original
    return {
      primer_nombre: persona.primer_nombre,
      segundo_nombre: persona.segundo_nombre,
      apellido_pat: persona.apellido_pat,
      apellido_mat: persona.apellido_mat,
      razon: 'CURP inválido - sin cambios'
    };
  }

  const curp = persona.curp.toUpperCase();
  const primeraLetraApellidoPat = curp[0];
  const primeraLetraApellidoMat = curp[2];
  const primeraLetraPrimerNombre = curp[3];

  // Casos especiales conocidos
  if (curp.startsWith('ROHG')) {
    // MA GUADALUPE DE LA ROSA HINOJOSA
    return {
      primer_nombre: 'MA GUADALUPE',
      segundo_nombre: null,
      apellido_pat: 'DE LA ROSA',
      apellido_mat: 'HINOJOSA',
      razon: 'Patrón: MA GUADALUPE + apellido compuesto DE LA ROSA'
    };
  }

  // ESTRATEGIA: Buscar desde el final hacia adelante
  // Los últimos 1-2 elementos son apellidos
  // El resto son nombres

  let apellidoMat = null;
  let apellidoPat = '';
  let indexFinNombres = palabras.length;

  // Identificar apellido materno (última palabra o dos si tiene DE/DEL/DE LA)
  if (palabras.length >= 1) {
    const ultimaPalabra = palabras[palabras.length - 1];

    // Verificar si coincide con CURP
    if (ultimaPalabra[0] === primeraLetraApellidoMat) {
      apellidoMat = ultimaPalabra;
      indexFinNombres--;
    } else if (palabras.length >= 3) {
      // Podría ser apellido compuesto: "DE LA GARZA"
      const penultima = palabras[palabras.length - 2];
      const antepenultima = palabras.length >= 3 ? palabras[palabras.length - 3] : '';

      if (antepenultima && antepenultima === 'DE' && penultima === 'LA') {
        apellidoMat = `${antepenultima} ${penultima} ${ultimaPalabra}`;
        indexFinNombres -= 3;
      } else if (penultima === 'DEL' || (penultima === 'DE' && ultimaPalabra[0] === primeraLetraApellidoMat)) {
        apellidoMat = `${penultima} ${ultimaPalabra}`;
        indexFinNombres -= 2;
      } else {
        apellidoMat = ultimaPalabra;
        indexFinNombres--;
      }
    } else {
      apellidoMat = ultimaPalabra;
      indexFinNombres--;
    }
  }

  // Identificar apellido paterno
  if (indexFinNombres >= 1) {
    const palabraApellidoPat = palabras[indexFinNombres - 1];

    // Verificar si coincide con CURP
    if (palabraApellidoPat[0] === primeraLetraApellidoPat) {
      apellidoPat = palabraApellidoPat;
      indexFinNombres--;
    } else if (indexFinNombres >= 3) {
      // Podría ser apellido compuesto: "DE LA ROSA"
      const anterior1 = indexFinNombres >= 2 ? palabras[indexFinNombres - 2] : '';
      const anterior2 = indexFinNombres >= 3 ? palabras[indexFinNombres - 3] : '';

      if (anterior2 && anterior2 === 'DE' && anterior1 === 'LA' && palabraApellidoPat[0] === primeraLetraApellidoPat) {
        apellidoPat = `${anterior2} ${anterior1} ${palabraApellidoPat}`;
        indexFinNombres -= 3;
      } else if (anterior1 === 'DEL' && palabraApellidoPat[0] === primeraLetraApellidoPat) {
        apellidoPat = `${anterior1} ${palabraApellidoPat}`;
        indexFinNombres -= 2;
      } else if (anterior1 === 'DE' && palabraApellidoPat[0] === primeraLetraApellidoPat) {
        apellidoPat = `${anterior1} ${palabraApellidoPat}`;
        indexFinNombres -= 2;
      } else {
        apellidoPat = palabraApellidoPat;
        indexFinNombres--;
      }
    } else {
      apellidoPat = palabraApellidoPat;
      indexFinNombres--;
    }
  }

  // Todo lo que queda son nombres
  const partesNombre = palabras.slice(0, indexFinNombres);

  let primerNombre = '';
  let segundoNombre = null;

  if (partesNombre.length > 0) {
    // Nombres compuestos comunes
    const nombreUnido = partesNombre.join(' ');

    const nombresCompuestos = [
      'MARIA DE JESUS',
      'MARIA DE LOURDES',
      'MARIA DE LA LUZ',
      'MARIA DEL CARMEN',
      'MARIA DE LOS ANGELES',
      'MARIA GUADALUPE',
      'MA GUADALUPE',
      'JOSE LUIS',
      'JUAN CARLOS',
      'MARIA ELENA',
      'ANA MARIA',
      'ROSA MARIA',
      'MARIA TERESA',
      'MARIA ISABEL',
      'MARIA LUISA',
      'MARIA CRISTINA',
      'JOSE ANTONIO',
      'JOSE MANUEL',
    ];

    let encontrado = false;
    for (const compuesto of nombresCompuestos) {
      if (nombreUnido === compuesto || nombreUnido.startsWith(compuesto + ' ')) {
        primerNombre = compuesto;
        const resto = nombreUnido.substring(compuesto.length).trim();
        segundoNombre = resto || null;
        encontrado = true;
        break;
      }
    }

    if (!encontrado) {
      // Primer nombre es la primera palabra
      primerNombre = partesNombre[0];
      // Segundo nombre es el resto (si hay)
      if (partesNombre.length > 1) {
        segundoNombre = partesNombre.slice(1).join(' ');
      }
    }
  }

  // Fallback: si no detectamos correctamente, usar original
  if (!primerNombre) primerNombre = persona.primer_nombre;
  if (!apellidoPat) apellidoPat = persona.apellido_pat;

  return {
    primer_nombre: primerNombre,
    segundo_nombre: segundoNombre,
    apellido_pat: apellidoPat,
    apellido_mat: apellidoMat,
    razon: 'Corrección basada en CURP y reglas de nombres mexicanos'
  };
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ANÁLISIS Y CORRECCIÓN DE NOMBRES V2 (BASADO EN CURP)');
  console.log('═══════════════════════════════════════════════════════\n');

  const result = await pool.query<Persona>(`
    SELECT id, curp, primer_nombre, segundo_nombre, apellido_pat, apellido_mat
    FROM personas
    ORDER BY id
  `);

  const personas = result.rows;
  console.log(`📊 Total de personas: ${personas.length}\n`);

  const correcciones: any[] = [];
  let conCambios = 0;

  for (const persona of personas) {
    const corregido = corregirNombrePorCURP(persona);

    const cambios: string[] = [];

    if (persona.primer_nombre !== corregido.primer_nombre) {
      cambios.push(`primer_nombre: "${persona.primer_nombre}" → "${corregido.primer_nombre}"`);
    }
    if ((persona.segundo_nombre || '') !== (corregido.segundo_nombre || '')) {
      cambios.push(`segundo_nombre: "${persona.segundo_nombre || ''}" → "${corregido.segundo_nombre || ''}"`);
    }
    if (persona.apellido_pat !== corregido.apellido_pat) {
      cambios.push(`apellido_pat: "${persona.apellido_pat}" → "${corregido.apellido_pat}"`);
    }
    if ((persona.apellido_mat || '') !== (corregido.apellido_mat || '')) {
      cambios.push(`apellido_mat: "${persona.apellido_mat || ''}" → "${corregido.apellido_mat || ''}"`);
    }

    if (cambios.length > 0) {
      const antes = `${persona.primer_nombre} ${persona.segundo_nombre || ''} ${persona.apellido_pat} ${persona.apellido_mat || ''}`.trim();
      const despues = `${corregido.primer_nombre} ${corregido.segundo_nombre || ''} ${corregido.apellido_pat} ${corregido.apellido_mat || ''}`.trim();

      correcciones.push({
        id: persona.id,
        curp: persona.curp,
        antes,
        despues,
        cambios,
        corregido
      });

      conCambios++;
    }
  }

  console.log(`✅ Análisis completado`);
  console.log(`   Con cambios: ${conCambios}`);
  console.log(`   Sin cambios: ${personas.length - conCambios}\n`);

  // Mostrar muestra
  console.log('📋 MUESTRA (primeros 30):');
  console.log('═'.repeat(100));

  correcciones.slice(0, 30).forEach((c, idx) => {
    console.log(`\n${idx + 1}. CURP: ${c.curp}`);
    console.log(`   ANTES:   ${c.antes}`);
    console.log(`   DESPUÉS: ${c.despues}`);
  });

  // Guardar reporte
  fs.writeFileSync('data/logs/correcciones_nombres_v2.json', JSON.stringify(correcciones, null, 2));
  console.log(`\n📄 Reporte guardado: data/logs/correcciones_nombres_v2.json`);
  console.log(`\n⚠️  MODO ANÁLISIS - Para aplicar cambios, revisa el reporte primero\n`);

  await pool.end();
}

main().catch(console.error);
