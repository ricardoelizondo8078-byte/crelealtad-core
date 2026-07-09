const { spawn } = require('child_process');
const net = require('net');
const os = require('os');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const mobileEnvPath = path.join(root, 'apps', 'mobile', '.env');

function isPortOpen(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
}

function getLocalIp() {
  const nets = os.networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const netInfo of nets[name] || []) {
      if (netInfo.family === 'IPv4' && !netInfo.internal) {
        return netInfo.address;
      }
    }
  }

  return 'localhost';
}

function run(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'inherit',
  });

  return child;
}

async function main() {
  const localIp = getLocalIp();
  const apiBaseUrl = `http://${localIp}:3000`;

  fs.writeFileSync(
    mobileEnvPath,
    `EXPO_PUBLIC_API_BASE_URL=${apiBaseUrl}\n`,
    'utf8'
  );

  console.log(`API URL configurada para Expo: ${apiBaseUrl}`);

  const apiPortFree = await isPortOpen(3000);
  const expoPortFree = await isPortOpen(8081);

  const children = [];

  if (!apiPortFree) {
    console.log('API ya está ejecutándose en el puerto 3000.');
  } else {
    children.push(run('npm', ['start'], path.join(root, 'apps', 'api')));
  }

  if (!expoPortFree) {
    console.log('Expo ya está ejecutándose en el puerto 8081.');
  } else {
    children.push(run('npx', ['expo', 'start', '--clear', '--lan'], path.join(root, 'apps', 'mobile')));
  }

  if (children.length === 0) {
    console.log('CRELEALTAD CORE ya está ejecutándose.');
  }
}

main();
