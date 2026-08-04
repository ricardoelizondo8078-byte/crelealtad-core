const fs = require('fs');
const path = require('path');

// Leer archivo SEPOMEX
const inputFile = 'C:\\Users\\Admin\\Desktop\\CRELEALTAD CORE\\Nuevo León.txt';
const outputFile = 'C:\\Users\\Admin\\Desktop\\CRELEALTAD CORE\\SEPOMEX-NL-COMPLETO-FINAL.sql';

console.log('Leyendo archivo SEPOMEX...');
const content = fs.readFileSync(inputFile, 'latin1'); // latin1 para caracteres especiales

const lines = content.split('\n');
console.log(`Total de líneas: ${lines.length}`);

// Iniciar archivo SQL
let sqlContent = `-- ============================================================
-- CATÁLOGO COMPLETO SEPOMEX - NUEVO LEÓN
-- Generado automáticamente desde archivo oficial SEPOMEX
-- Fecha: ${new Date().toLocaleString('es-MX')}
-- Total de registros: ${lines.length - 2}
-- ============================================================

TRUNCATE TABLE codigos_postales CASCADE;

-- Insertar todos los códigos postales de Nuevo León
`;

let insertCount = 0;
let batchSize = 500; // Insertar en lotes de 500
let currentBatch = [];

// Procesar cada línea (empezar desde línea 2, después del encabezado)
for (let i = 2; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  const parts = line.split('|');

  // Formato del archivo:
  // 0: d_codigo (código postal)
  // 1: d_asenta (nombre de la colonia)
  // 2: d_tipo_asenta (tipo: Colonia, Fraccionamiento, etc.)
  // 3: D_mnpio (municipio)
  // 4: d_estado (estado)

  const codigo = parts[0] || '';
  const colonia = parts[1] || '';
  const tipo = parts[2] || '';
  const municipio = parts[3] || '';
  const estado = parts[4] || '';

  // Validar datos
  if (!codigo || !colonia || !municipio) {
    console.log(`Línea ${i}: Datos incompletos, omitiendo...`);
    continue;
  }

  // Escapar comillas simples para SQL
  const coloniaEscaped = colonia.replace(/'/g, "''");
  const tipoEscaped = tipo.replace(/'/g, "''");
  const municipioEscaped = municipio.replace(/'/g, "''");
  const estadoEscaped = estado.replace(/'/g, "''");

  // Agregar a lote actual
  currentBatch.push(`('${codigo}', '${coloniaEscaped}', '${municipioEscaped}', '${estadoEscaped}')`);
  insertCount++;

  // Si llegamos al tamaño del lote, escribir INSERT
  if (currentBatch.length >= batchSize) {
    sqlContent += `INSERT INTO codigos_postales (codigo, colonia, municipio, estado) VALUES\n`;
    sqlContent += currentBatch.join(',\n');
    sqlContent += ';\n\n';
    currentBatch = [];
  }
}

// Escribir el último lote si quedó algo
if (currentBatch.length > 0) {
  sqlContent += `INSERT INTO codigos_postales (codigo, colonia, municipio, estado) VALUES\n`;
  sqlContent += currentBatch.join(',\n');
  sqlContent += ';\n\n';
}

// Agregar queries de verificación
sqlContent += `
-- ============================================================
-- VERIFICACIÓN DE INSERCIÓN
-- ============================================================

-- Contar total de registros insertados
SELECT COUNT(*) as total_registros FROM codigos_postales;

-- Contar por municipio
SELECT municipio, COUNT(*) as total
FROM codigos_postales
GROUP BY municipio
ORDER BY total DESC;

-- Contar códigos postales únicos
SELECT COUNT(DISTINCT codigo) as codigos_unicos FROM codigos_postales;

-- Contar colonias únicas
SELECT COUNT(DISTINCT colonia) as colonias_unicas FROM codigos_postales;

-- RESUMEN FINAL
SELECT
    'TOTAL REGISTROS' as descripcion,
    COUNT(*) as cantidad
FROM codigos_postales
UNION ALL
SELECT
    'CÓDIGOS POSTALES ÚNICOS' as descripcion,
    COUNT(DISTINCT codigo) as cantidad
FROM codigos_postales
UNION ALL
SELECT
    'MUNICIPIOS' as descripcion,
    COUNT(DISTINCT municipio) as cantidad
FROM codigos_postales
UNION ALL
SELECT
    'COLONIAS ÚNICAS' as descripcion,
    COUNT(DISTINCT colonia) as cantidad
FROM codigos_postales;
`;

// Guardar archivo SQL
fs.writeFileSync(outputFile, sqlContent, 'utf8');

console.log('✅ Conversión completada!');
console.log(`   Total de registros procesados: ${insertCount}`);
console.log(`   Archivo SQL generado: ${outputFile}`);
console.log(`   Tamaño: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
