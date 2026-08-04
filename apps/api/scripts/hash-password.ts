import * as bcrypt from 'bcrypt';

async function main() {
  // Lee la contraseña desde argumentos de línea de comandos
  const password = process.argv[2];

  if (!password) {
    console.error('\n❌ Error: Debes proporcionar una contraseña como argumento');
    console.log('\nUso: npm run hash-password <tu-contraseña>\n');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  console.log('\n===========================================');
  console.log('HASH BCRYPT GENERADO:');
  console.log('===========================================');
  console.log('Hash:', hash);
  console.log('===========================================\n');
  console.log('⚠️  IMPORTANTE: Nunca compartas este hash públicamente');
  console.log('⚠️  CAMBIAR CONTRASEÑA: Si la anterior estaba expuesta, cámbiala inmediatamente\n');
}

main().catch(console.error);
