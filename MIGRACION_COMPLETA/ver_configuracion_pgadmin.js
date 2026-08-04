const Database = require('better-sqlite3');

const dbPath = 'C:\\Users\\Admin\\AppData\\Roaming\\pgAdmin\\pgadmin4.db';

console.log('\n📊 Configuración de pgAdmin\n');

const db = new Database(dbPath, { readonly: true });

// Ver estructura de la tabla user_preferences
console.log('Estructura de user_preferences:');
console.log('-'.repeat(60));
const columns = db.prepare(`PRAGMA table_info(user_preferences)`).all();
columns.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

// Ver todas las preferencias
console.log('\n\nPreferencias actuales:');
console.log('='.repeat(60));
const prefs = db.prepare(`SELECT * FROM user_preferences`).all();

if (prefs.length > 0) {
  prefs.forEach(pref => {
    console.log(`\nID: ${pref.pid}`);
    console.log(`Value: ${pref.value}`);
  });
} else {
  console.log('(Sin preferencias)');
}

// Ver tabla preferences
console.log('\n\nTabla preferences (definiciones):');
console.log('='.repeat(60));
const prefDefs = db.prepare(`SELECT * FROM preferences WHERE name LIKE '%row%' OR name LIKE '%max%'`).all();
prefDefs.forEach(pref => {
  console.log(`\n${pref.name}:`);
  console.log(`  ID: ${pref.id}`);
  console.log(`  Category: ${pref.cid}`);
  console.log(`  Default: ${pref.default_value}`);
});

db.close();
