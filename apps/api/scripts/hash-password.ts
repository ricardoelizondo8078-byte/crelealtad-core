import * as bcrypt from 'bcrypt';

async function main() {
  const password = process.env.REQUIRED_SECRET;
  const hash = await bcrypt.hash(password, 10);
  console.log('\n===========================================');
  console.log('HASH BCRYPT GENERADO:');
  console.log('===========================================');
  console.log('Contraseña:', password);
  console.log('Hash:', hash);
  console.log('===========================================\n');
}

main().catch(console.error);
