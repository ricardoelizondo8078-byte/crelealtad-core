const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
let filesModified = 0;

function processFile(filePath) {
  if (!filePath.endsWith('.tsx')) {
    return;
  }

  const originalContent = fs.readFileSync(filePath, 'utf8');
  let content = originalContent;

  // Agregar allowFontScaling={false} a todos los <Text ...> que NO lo tengan ya
  content = content.replace(/<Text(\s)/g, (match, space) => {
    // Leer el resto de la línea para ver si ya tiene allowFontScaling
    const nextChars = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + 200);
    if (nextChars.includes('allowFontScaling')) {
      return match; // Ya lo tiene, no modificar
    }
    return `<Text allowFontScaling={false}${space}`;
  });

  // Agregar allowFontScaling={false} a todos los <Text> que no tengan props
  content = content.replace(/<Text>/g, '<Text allowFontScaling={false}>');

  // Lo mismo para TextInput
  content = content.replace(/<TextInput(\s)/g, (match, space) => {
    const nextChars = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + 200);
    if (nextChars.includes('allowFontScaling')) {
      return match;
    }
    return `<TextInput allowFontScaling={false}${space}`;
  });

  content = content.replace(/<TextInput>/g, '<TextInput allowFontScaling={false}>');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log(`✅ ${path.relative(srcDir, filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath);
    } else {
      processFile(filePath);
    }
  });
}

console.log('🚀 Agregando allowFontScaling={false} a todos los componentes Text y TextInput...\n');
walkDir(srcDir);
console.log(`\n✅ Completado! ${filesModified} archivos modificados.`);
