const Database = require('better-sqlite3');

const dbPath = 'C:\\Users\\Admin\\AppData\\Roaming\\pgAdmin\\pgadmin4.db';

console.log('\n📊 Inspeccionando estructura de pgadmin4.db...\n');

const db = new Database(dbPath, { readonly: true });

// Listar todas las tablas
console.log('Tablas en la base de datos:');
console.log('-'.repeat(60));
const tables = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type='table'
  ORDER BY name
`).all();

tables.forEach(table => {
  console.log(`  📋 ${table.name}`);
});

// Ver estructura de cada tabla
console.log('\n\nEstructura de tablas relevantes:');
console.log('='.repeat(60));

tables.forEach(table => {
  console.log(`\n📋 Tabla: ${table.name}`);
  console.log('-'.repeat(60));

  const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
  columns.forEach(col => {
    console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
  });

  // Mostrar algunos datos de ejemplo
  try {
    const sample = db.prepare(`SELECT * FROM ${table.name} LIMIT 3`).all();
    if (sample.length > 0) {
      console.log('\n  Muestra de datos:');
      sample.forEach((row, idx) => {
        console.log(`  ${idx + 1}. ${JSON.stringify(row)}`);
      });
    }
  } catch (e) {
    // Ignorar errores
  }
});

db.close();
