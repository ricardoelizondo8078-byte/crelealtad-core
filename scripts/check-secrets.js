const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.ts', '.tsx']);
const EXCLUDED_SEGMENTS = new Set(['node_modules', 'dist', 'build', 'coverage', '.git']);

const RULES = [
  {
    id: 'literal-password',
    pattern: /(?:\bpassword|\busuario_password)\s*:\s*(['"])(?!\s*\1)[^\r\n]*?\1/g,
    message: 'contraseña literal en configuración o código',
  },
  {
    id: 'password-fallback',
    pattern: /\bpassword\s*:\s*process\.env\.[A-Z0-9_]+\s*\|\|\s*(['"])[^\r\n]*?\1/g,
    message: 'contraseña de respaldo incrustada',
  },
  {
    id: 'literal-credential-variable',
    pattern: /\b(?:const|let|var)\s+[A-Za-z0-9_]*(?:pin|password|secret)[A-Za-z0-9_]*\s*=\s*(['"])(?!\s*\1)[^\r\n]*?\1/gi,
    message: 'credencial literal asignada a una variable',
  },
  {
    id: 'private-key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    message: 'llave privada incluida en el repositorio',
  },
];

function repositoryFiles() {
  const output = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard'],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );

  return [...new Set(output.split(/\r?\n/).filter(Boolean))];
}

function shouldInspect(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  const segments = normalized.split('/');

  if (segments.some((segment) => EXCLUDED_SEGMENTS.has(segment))) return false;
  if (/\.(?:spec|test)\.[cm]?[jt]sx?$/.test(normalized)) return false;
  return SOURCE_EXTENSIONS.has(path.extname(normalized).toLowerCase());
}

function lineNumber(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

const findings = [];

for (const relativePath of repositoryFiles().filter(shouldInspect)) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) continue;

  const source = fs.readFileSync(absolutePath, 'utf8');
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      const declaration = match[0].split('=')[0];
      if (
        rule.id === 'literal-credential-variable'
        && (
          /(?:ENV|CONFIG|HEADER|STORAGE)_KEY/i.test(declaration)
          || (
            relativePath.replaceAll('\\', '/') === 'apps/api/src/auth/jwt.config.ts'
            && /DEVELOPMENT_JWT_SECRET/.test(declaration)
          )
        )
      ) {
        continue;
      }

      findings.push({
        file: relativePath.replaceAll('\\', '/'),
        line: lineNumber(source, match.index),
        rule: rule.id,
        message: rule.message,
      });
    }
  }
}

if (findings.length > 0) {
  console.error('Se detectaron posibles secretos. Los valores no se muestran:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.rule}] ${finding.message}`);
  }
  process.exitCode = 1;
} else {
  console.log('Secret scan: sin credenciales literales en código ejecutable.');
}
