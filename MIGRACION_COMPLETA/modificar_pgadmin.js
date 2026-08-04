const Database = require('better-sqlite3');
const fs = require('fs');

const dbPath = 'C:\\Users\\Admin\\AppData\\Roaming\\pgAdmin\\pgadmin4.db';
const backupPath = `${dbPath}.backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;

console.log('\n' + '='.repeat(60));
console.log('  MODIFICANDO CONFIGURACIÓN DE PGADMIN');
console.log('='.repeat(60) + '\n');

// Hacer backup
console.log('📦 Creando backup...');
fs.copyFileSync(dbPath, backupPath);
console.log(`✅ Backup creado: ${backupPath}\n`);

// Abrir base de datos
const db = new Database(dbPath);

// Ver configuración actual
console.log('📊 Configuración actual:');
console.log('-'.repeat(60));
const currentSettings = db.prepare(`
  SELECT name, value
  FROM setting
  WHERE name LIKE '%count%'
     OR name LIKE '%max%'
     OR name LIKE '%limit%'
     OR name LIKE '%rows%'
`).all();

if (currentSettings.length > 0) {
  currentSettings.forEach(row => {
    console.log(`  ${row.name}: ${row.value}`);
  });
} else {
  console.log('  (Sin configuraciones encontradas)');
}

console.log('\n🔧 Actualizando configuración...');
console.log('-'.repeat(60));

// Configuraciones a establecer
const settings = [
  { name: 'query_tool_max_rows', value: '10000' },
  { name: 'rows_to_show', value: '10000' },
  { name: 'max_query_hist_stored', value: '10000' },
  { name: 'auto_expand_sole_children', value: 'true' },
];

const stmt = db.prepare(`
  INSERT OR REPLACE INTO setting (name, value)
  VALUES (?, ?)
`);

settings.forEach(setting => {
  stmt.run(setting.name, setting.value);
  console.log(`✅ ${setting.name} = ${setting.value}`);
});

// Mostrar nueva configuración
console.log('\n📊 Configuración actualizada:');
console.log('-'.repeat(60));
const newSettings = db.prepare(`
  SELECT name, value
  FROM setting
  WHERE name LIKE '%count%'
     OR name LIKE '%max%'
     OR name LIKE '%limit%'
     OR name LIKE '%rows%'
`).all();

newSettings.forEach(row => {
  console.log(`  ${row.name}: ${row.value}`);
});

// Cerrar conexión
db.close();

console.log('\n' + '='.repeat(60));
console.log('✅ CONFIGURACIÓN MODIFICADA EXITOSAMENTE');
console.log('='.repeat(60));
console.log('\n⚠️  IMPORTANTE: Debes REINICIAR pgAdmin para que los cambios surtan efecto\n');
console.log('Pasos para reiniciar:');
console.log('  1. Cerrar completamente pgAdmin');
console.log('  2. Abrir pgAdmin nuevamente');
console.log('  3. Ir a: File → Preferences → Query Tool → Results grid');
console.log('  4. Verificar que "Max rows to show" esté en 10000');
console.log();
