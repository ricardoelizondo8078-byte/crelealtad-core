import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

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

interface Correccion {
  id: string;
  curp: string;
  nombre_completo_actual: string;
  primer_nombre_actual: string;
  segundo_nombre_actual: string;
  apellido_pat_actual: string;
  apellido_mat_actual: string;
  primer_nombre_propuesto: string;
  segundo_nombre_propuesto: string;
  apellido_pat_propuesto: string;
  apellido_mat_propuesto: string;
  nombre_completo_propuesto: string;
  nivel_confianza: string;
  regla_aplicada: string;
  requiere_revision: string;
  aprobar: string;
}

// Nombres compuestos que SIEMPRE deben ir juntos
const NOMBRES_COMPUESTOS = [
  'MARIA GUADALUPE',
  'MARIA DE JESUS',
  'MARIA DE LOURDES',
  'MARIA DE LA LUZ',
  'MARIA DEL CARMEN',
  'MARIA DE LOS ANGELES',
  'MA GUADALUPE',
  'JOSE LUIS',
  'JUAN CARLOS',
  'ANA MARIA',
  'ROSA MARIA',
  'MARIA TERESA',
  'MARIA ELENA',
  'MARIA ISABEL',
  'MARIA LUISA',
  'MARIA CRISTINA',
  'MARIA FERNANDA',
  'JOSE ANTONIO',
  'JOSE MANUEL',
  'LUIS MIGUEL',
  'CARLOS ALBERTO',
  'MARIA DEL ROSARIO',
  'MARIA DEL PILAR',
  'JUAN PABLO',
  'JOSE MARIA',
  'MARIA DOLORES',
  'MARIA MERCEDES',
];

function corregirNombre(persona: Persona): Correccion {
  // Construir nombre completo actual
  const nombreCompletoActual = [
    persona.primer_nombre,
    persona.segundo_nombre,
    persona.apellido_pat,
    persona.apellido_mat
  ].filter(Boolean).join(' ');

  // Limpiar y normalizar
  const nombreLimpio = nombreCompletoActual
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const palabras = nombreLimpio.split(' ');

  // Valores por defecto (sin cambios)
  let primerNombre = persona.primer_nombre;
  let segundoNombre = persona.segundo_nombre || '';
  let apellidoPat = persona.apellido_pat;
  let apellidoMat = persona.apellido_mat || '';
  let nivelConfianza = 'SIN_CAMBIOS';
  let reglaAplicada = 'Ninguna';
  let requiereRevision = 'NO';

  // REGLA 1: Nombres compuestos conocidos
  const nombreInicio = `${persona.primer_nombre} ${persona.segundo_nombre || ''}`.trim();

  for (const compuesto of NOMBRES_COMPUESTOS) {
    if (nombreInicio === compuesto) {
      primerNombre = compuesto;
      segundoNombre = '';
      nivelConfianza = 'ALTA';
      reglaAplicada = 'Nombre compuesto conocido';
      requiereRevision = 'NO';
      break;
    }
  }

  // REGLA 2: Quitar comas en apellidos
  if (apellidoPat.includes(',') || apellidoMat.includes(',')) {
    apellidoPat = apellidoPat.replace(/,/g, ' ').trim();
    apellidoMat = apellidoMat.replace(/,/g, ' ').trim();
    nivelConfianza = 'ALTA';
    reglaAplicada = 'Eliminar comas';
    requiereRevision = 'NO';
  }

  // REGLA 3: "DE LA", "DEL" en apellidos
  // Si segundo_nombre termina con "DE LA" y apellido_pat no empieza con "DE"
  if (persona.segundo_nombre && persona.segundo_nombre.includes('DE LA')) {
    const partes = persona.segundo_nombre.split(' ');
    const indexDe = partes.indexOf('DE');

    if (indexDe >= 0 && partes[indexDe + 1] === 'LA') {
      // El segundo nombre tiene "DE LA" al final
      segundoNombre = partes.slice(0, indexDe).join(' ');
      const restoApellido = partes.slice(indexDe).join(' ') + ' ' + persona.apellido_pat;
      apellidoPat = restoApellido.trim();
      nivelConfianza = 'MEDIA';
      reglaAplicada = 'Apellido compuesto DE LA';
      requiereRevision = 'SI';
    }
  }

  // REGLA 4: Segundo nombre muy largo (probable mezcla con apellidos)
  if (persona.segundo_nombre && persona.segundo_nombre.split(' ').length > 2) {
    const partesSegundoNombre = persona.segundo_nombre.split(' ');

    // Si tiene más de 2 palabras, probablemente las últimas sean apellidos
    if (partesSegundoNombre.length === 3) {
      segundoNombre = partesSegundoNombre[0];
      // Las otras palabras podrían ser parte de apellidos
      nivelConfianza = 'BAJA';
      reglaAplicada = 'Segundo nombre largo detectado';
      requiereRevision = 'SI';
    }
  }

  // REGLA 5: Detectar "DE JESUS" como parte del nombre
  if (persona.segundo_nombre === 'DE' && persona.apellido_pat === 'JESUS') {
    // Esto probablemente es "TERESA DE JESUS [APELLIDO]"
    primerNombre = `${persona.primer_nombre} DE JESUS`;
    segundoNombre = '';

    // El apellido real debería ser apellido_mat
    if (persona.apellido_mat) {
      const apellidos = persona.apellido_mat.split(' ');
      apellidoPat = apellidos[0];
      apellidoMat = apellidos.slice(1).join(' ');
    } else {
      apellidoPat = persona.apellido_mat || '';
      apellidoMat = '';
    }

    nivelConfianza = 'MEDIA';
    reglaAplicada = 'DE JESUS como nombre compuesto';
    requiereRevision = 'SI';
  }

  // Construir nombre completo propuesto
  const nombreCompletoPropuesto = [
    primerNombre,
    segundoNombre,
    apellidoPat,
    apellidoMat
  ].filter(Boolean).join(' ');

  // Determinar si hubo cambios
  const hubo_cambios =
    primerNombre !== persona.primer_nombre ||
    segundoNombre !== (persona.segundo_nombre || '') ||
    apellidoPat !== persona.apellido_pat ||
    apellidoMat !== (persona.apellido_mat || '');

  if (!hubo_cambios) {
    nivelConfianza = 'SIN_CAMBIOS';
    reglaAplicada = 'Ninguna';
    requiereRevision = 'NO';
  }

  return {
    id: persona.id,
    curp: persona.curp,
    nombre_completo_actual: nombreCompletoActual,
    primer_nombre_actual: persona.primer_nombre,
    segundo_nombre_actual: persona.segundo_nombre || '',
    apellido_pat_actual: persona.apellido_pat,
    apellido_mat_actual: persona.apellido_mat || '',
    primer_nombre_propuesto: primerNombre,
    segundo_nombre_propuesto: segundoNombre,
    apellido_pat_propuesto: apellidoPat,
    apellido_mat_propuesto: apellidoMat,
    nombre_completo_propuesto: nombreCompletoPropuesto,
    nivel_confianza: nivelConfianza,
    regla_aplicada: reglaAplicada,
    requiere_revision: requiereRevision,
    aprobar: hubo_cambios ? '' : 'N/A',
  };
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  GENERANDO CORRECCIONES PARA REVISIÓN');
  console.log('═══════════════════════════════════════════════════════\n');

  // Obtener todas las personas
  const result = await pool.query<Persona>(`
    SELECT id, curp, primer_nombre, segundo_nombre, apellido_pat, apellido_mat
    FROM personas
    ORDER BY id
  `);

  console.log(`📊 Total de personas: ${result.rows.length}`);

  const correcciones: Correccion[] = [];
  let conCambios = 0;
  let altaConfianza = 0;
  let mediaConfianza = 0;
  let bajaConfianza = 0;

  for (const persona of result.rows) {
    const correccion = corregirNombre(persona);

    if (correccion.nivel_confianza !== 'SIN_CAMBIOS') {
      correcciones.push(correccion);
      conCambios++;

      if (correccion.nivel_confianza === 'ALTA') altaConfianza++;
      if (correccion.nivel_confianza === 'MEDIA') mediaConfianza++;
      if (correccion.nivel_confianza === 'BAJA') bajaConfianza++;
    }
  }

  console.log(`\n✅ Análisis completado:`);
  console.log(`   Total con cambios propuestos: ${conCambios}`);
  console.log(`   Sin cambios: ${result.rows.length - conCambios}`);
  console.log(`\n📊 Por nivel de confianza:`);
  console.log(`   ALTA (aplicar directamente): ${altaConfianza}`);
  console.log(`   MEDIA (revisar antes): ${mediaConfianza}`);
  console.log(`   BAJA (revisar manualmente): ${bajaConfianza}`);

  // Guardar a Excel
  const excelPath = 'data/logs/CORRECCIONES_PARA_REVISION.xlsx';
  const wb = XLSX.utils.book_new();

  // Hoja 1: Todas las correcciones
  const ws1 = XLSX.utils.json_to_sheet(correcciones);
  XLSX.utils.book_append_sheet(wb, ws1, 'Todas las Correcciones');

  // Hoja 2: Solo ALTA confianza
  const altaConfianzaData = correcciones.filter(c => c.nivel_confianza === 'ALTA');
  const ws2 = XLSX.utils.json_to_sheet(altaConfianzaData);
  XLSX.utils.book_append_sheet(wb, ws2, 'ALTA Confianza');

  // Hoja 3: MEDIA/BAJA confianza (requieren revisión)
  const revisionData = correcciones.filter(c => c.nivel_confianza !== 'ALTA');
  const ws3 = XLSX.utils.json_to_sheet(revisionData);
  XLSX.utils.book_append_sheet(wb, ws3, 'Requieren Revisión');

  // Hoja 4: Instrucciones
  const instrucciones = [
    { Instruccion: '1. Revisa la hoja "ALTA Confianza" - estas se pueden aplicar directamente' },
    { Instruccion: '2. Revisa la hoja "Requieren Revisión" - verifica cada una' },
    { Instruccion: '3. En la columna "aprobar" escribe:' },
    { Instruccion: '   - SI = aplicar la corrección propuesta' },
    { Instruccion: '   - NO = mantener el valor actual (sin cambios)' },
    { Instruccion: '   - CUSTOM = escribir manualmente los valores correctos' },
    { Instruccion: '4. Guarda el archivo' },
    { Instruccion: '5. Ejecuta el script de aplicación de correcciones' },
    { Instruccion: '' },
    { Instruccion: 'NIVELES DE CONFIANZA:' },
    { Instruccion: 'ALTA = Nombres compuestos conocidos (MARIA GUADALUPE, etc)' },
    { Instruccion: 'MEDIA = Reglas aplicadas pero requieren validación' },
    { Instruccion: 'BAJA = Casos complejos que necesitan revisión manual' },
  ];
  const ws4 = XLSX.utils.json_to_sheet(instrucciones);
  XLSX.utils.book_append_sheet(wb, ws4, 'INSTRUCCIONES');

  XLSX.writeFile(wb, excelPath);

  console.log(`\n📄 Archivo Excel generado: ${excelPath}`);
  console.log(`\n📋 SIGUIENTE PASO:`);
  console.log(`   1. Abre el archivo Excel: ${excelPath}`);
  console.log(`   2. Revisa la hoja "ALTA Confianza" (${altaConfianza} casos)`);
  console.log(`   3. Revisa la hoja "Requieren Revisión" (${mediaConfianza + bajaConfianza} casos)`);
  console.log(`   4. En la columna "aprobar" marca:`);
  console.log(`      - SI = aplicar corrección`);
  console.log(`      - NO = no cambiar`);
  console.log(`   5. Guarda el archivo`);
  console.log(`   6. Ejecuta: npm run aplicar-correcciones`);

  // Guardar también JSON para el script de aplicación
  fs.writeFileSync('data/logs/correcciones_generadas.json', JSON.stringify(correcciones, null, 2));
  console.log(`\n✅ También guardado en: data/logs/correcciones_generadas.json\n`);

  // Mostrar muestra de alta confianza
  console.log('\n📋 MUESTRA DE CORRECCIONES ALTA CONFIANZA (primeras 10):');
  console.log('═'.repeat(100));
  altaConfianzaData.slice(0, 10).forEach((c, idx) => {
    console.log(`\n${idx + 1}. CURP: ${c.curp}`);
    console.log(`   ACTUAL:    ${c.nombre_completo_actual}`);
    console.log(`   PROPUESTO: ${c.nombre_completo_propuesto}`);
    console.log(`   REGLA: ${c.regla_aplicada}`);
  });

  await pool.end();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
