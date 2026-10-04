const { spawn, spawnSync } = require('child_process');
const dgram = require('dgram');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');

const root = process.cwd();
const apiDirectory = path.join(root, 'apps', 'api');
const mobileDirectory = path.join(root, 'apps', 'mobile');
const apiPort = 3100;
const isRemoteMode = process.argv.slice(2).includes('--remote');
const isTailscaleMode = process.argv.slice(2).includes('--tailscale');
const expoPort = isTailscaleMode ? 8084 : 8081;
const children = [];
let activeLocalIp = null;
let networkMonitor = null;
let checkingNetwork = false;
let shuttingDown = false;

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port, '0.0.0.0');
  });
}

function isExpoHealthy() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port: expoPort,
        path: '/status',
        timeout: 1500,
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          resolve(response.statusCode === 200 && body.includes('packager-status:running'));
        });
      },
    );

    request.once('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.once('error', () => resolve(false));
  });
}

function getDefaultRouteIp() {
  return new Promise((resolve) => {
    const socket = dgram.createSocket('udp4');
    const timeoutId = setTimeout(() => {
      socket.close();
      resolve(null);
    }, 1500);

    socket.once('error', () => {
      clearTimeout(timeoutId);
      socket.close();
      resolve(null);
    });

    socket.connect(53, '1.1.1.1', () => {
      clearTimeout(timeoutId);
      const address = socket.address();
      socket.close();
      resolve(typeof address === 'object' ? address.address : null);
    });
  });
}

function getFallbackLocalIp() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const netInfo of nets[name] || []) {
      if (
        netInfo.family === 'IPv4'
        && !netInfo.internal
        && !netInfo.address.startsWith('169.254.')
      ) {
        candidates.push({ name, address: netInfo.address });
      }
    }
  }

  const physicalAdapter = candidates.find(({ name }) =>
    !/(virtual|vethernet|hyper-v|wsl|docker|vmware|virtualbox|loopback)/i.test(name),
  );

  return physicalAdapter?.address ?? candidates[0]?.address ?? null;
}

function getTailscaleIp() {
  const candidates = [];

  for (const name of Object.keys(os.networkInterfaces())) {
    for (const netInfo of os.networkInterfaces()[name] || []) {
      if (netInfo.family !== 'IPv4' || netInfo.internal) continue;

      const octets = netInfo.address.split('.').map(Number);
      const isTailscaleRange = octets.length === 4
        && octets[0] === 100
        && octets[1] >= 64
        && octets[1] <= 127;
      if (/tailscale/i.test(name) || isTailscaleRange) {
        candidates.push({ name, address: netInfo.address });
      }
    }
  }

  return candidates.find(({ name }) => /tailscale/i.test(name))?.address
    ?? candidates[0]?.address
    ?? null;
}

async function getLocalIp() {
  return (await getDefaultRouteIp()) ?? getFallbackLocalIp();
}

function isApiHealthy() {
  return new Promise((resolve) => {
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port: apiPort,
        path: '/health',
        timeout: 1500,
      },
      (response) => {
        response.resume();
        resolve(response.statusCode === 200);
      },
    );

    request.once('timeout', () => {
      request.destroy();
      resolve(false);
    });
    request.once('error', () => resolve(false));
  });
}

async function waitForApi() {
  const deadline = Date.now() + 45000;

  while (Date.now() < deadline) {
    if (await isApiHealthy()) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  throw new Error(`La API no respondió en http://127.0.0.1:${apiPort}/health.`);
}

function runNpm(args, cwd, extraEnv = {}) {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? (process.env.ComSpec || 'cmd.exe') : 'npm';
  const commandArgs = isWindows
    ? ['/d', '/s', '/c', 'npm.cmd', ...args]
    : args;
  const child = spawn(command, commandArgs, {
    cwd,
    env: { ...process.env, ...extraEnv },
    shell: false,
    stdio: 'inherit',
  });

  children.push(child);
  return child;
}

function restartIfChildStops(child, label) {
  child.once('error', (error) => {
    if (!shuttingDown) {
      console.error(`${label} no pudo iniciar: ${error.message}`);
      shutdown(1);
    }
  });

  child.once('exit', (code, signal) => {
    if (!shuttingDown) {
      const detail = signal ? `señal ${signal}` : `código ${code}`;
      console.error(`${label} terminó inesperadamente (${detail}).`);
      shutdown(code || 1);
    }
  });
}

function stopChildren() {
  for (const child of children) {
    if (child.killed || !child.pid) {
      continue;
    }

    if (process.platform === 'win32') {
      spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
    } else {
      child.kill('SIGTERM');
    }
  }
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  if (networkMonitor) {
    clearInterval(networkMonitor);
  }
  stopChildren();
  process.exit(exitCode);
}

function startNetworkMonitor() {
  const startedAt = Date.now();
  let apiFailures = 0;
  let expoFailures = 0;

  networkMonitor = setInterval(async () => {
    if (checkingNetwork || shuttingDown) {
      return;
    }

    checkingNetwork = true;
    try {
      const currentIp = await getLocalIp();
      if (!isTailscaleMode && currentIp && currentIp !== activeLocalIp) {
        console.log(`La red cambió de ${activeLocalIp} a ${currentIp}. Reiniciando...`);
        shutdown(75);
        return;
      }

      if (Date.now() - startedAt < 90000) {
        return;
      }

      const [apiHealthy, expoHealthy] = await Promise.all([
        isApiHealthy(),
        isExpoHealthy(),
      ]);

      apiFailures = apiHealthy ? 0 : apiFailures + 1;
      expoFailures = expoHealthy ? 0 : expoFailures + 1;

      if (apiFailures >= 6 || expoFailures >= 6) {
        const failedService = apiFailures >= 6 ? 'la API' : 'Expo';
        console.error(`El supervisor detectó que ${failedService} dejó de responder. Reiniciando...`);
        shutdown(1);
      }
    } finally {
      checkingNetwork = false;
    }
  }, 5000);
}

async function main() {
  const localIp = await getLocalIp();
  if (!localIp) {
    throw new Error('No se encontró una dirección IPv4 activa para la laptop.');
  }

  activeLocalIp = localIp;
  const tailscaleIp = isTailscaleMode ? getTailscaleIp() : null;
  if (isTailscaleMode && !tailscaleIp) {
    throw new Error('Tailscale todavía no tiene una dirección IPv4 activa.');
  }

  const lanApiBaseUrl = `http://${localIp}:${apiPort}`;
  const explicitApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || null;
  const apiBaseUrl = isTailscaleMode
    ? explicitApiBaseUrl || `http://${tailscaleIp}:${apiPort}`
    : isRemoteMode
      ? explicitApiBaseUrl
      : lanApiBaseUrl;

  const developmentMode = isTailscaleMode
    ? 'REMOTO PRIVADO (Tailscale)'
    : isRemoteMode
      ? 'REMOTO (túnel Expo)'
      : 'LAN';

  console.log(`Modo de desarrollo: ${developmentMode}`);
  console.log(`Red detectada: ${localIp}`);
  if (tailscaleIp) {
    console.log(`Tailscale detectado: ${tailscaleIp}`);
  }
  if (apiBaseUrl) {
    console.log(`API para la app: ${apiBaseUrl}`);
  } else {
    console.warn(
      'Expo quedará disponible por túnel, pero la API sigue limitada a LAN. '
      + 'Para usar datos desde otra red se requiere configurar EXPO_PUBLIC_API_BASE_URL '
      + 'con una dirección remota segura aprobada.',
    );
  }

  const apiPortAvailable = await isPortAvailable(apiPort);
  const expoPortAvailable = await isPortAvailable(expoPort);
  const existingApiHealthy = !apiPortAvailable && await isApiHealthy();
  const existingExpoHealthy = !expoPortAvailable && await isExpoHealthy();

  if (!apiPortAvailable && !existingApiHealthy) {
    throw new Error(
      `El puerto ${apiPort} está ocupado por un proceso que no responde como la API de CRELEALTAD.`,
    );
  }

  if (!expoPortAvailable && !existingExpoHealthy) {
    throw new Error(
      `El puerto ${expoPort} está ocupado por un proceso que no responde como Expo.`,
    );
  }

  if (isRemoteMode && !isTailscaleMode && existingExpoHealthy) {
    throw new Error(
      `Expo ya está ejecutándose en el puerto ${expoPort}. Detén esa instancia antes de iniciar el túnel remoto.`,
    );
  }

  if (apiPortAvailable) {
    const apiProcess = runNpm(['run', 'start:dev'], apiDirectory, {
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: String(apiPort),
    });
    restartIfChildStops(apiProcess, 'La API');
    await waitForApi();
    console.log('API lista.');
  } else {
    console.log('API existente verificada; se reutilizará.');
  }

  if (expoPortAvailable) {
    const expoCommand = isTailscaleMode
      ? ['run', 'start', '--', '--lan', '--go', '--port', String(expoPort)]
      : isRemoteMode
        ? ['run', 'start:remote', '--', '--go']
        : ['run', 'start', '--', '--offline', '--go'];
    const expoEnvironment = {
      EXPO_PUBLIC_API_PORT: String(apiPort),
      ...(apiBaseUrl ? { EXPO_PUBLIC_API_BASE_URL: apiBaseUrl } : {}),
      ...(isTailscaleMode
        ? { REACT_NATIVE_PACKAGER_HOSTNAME: tailscaleIp }
        : isRemoteMode
          ? {}
          : { REACT_NATIVE_PACKAGER_HOSTNAME: localIp }),
    };
    const expoProcess = runNpm(expoCommand, mobileDirectory, expoEnvironment);
    restartIfChildStops(expoProcess, 'Expo');
  } else {
    console.log('Expo existente verificado; se reutilizará.');
  }
  startNetworkMonitor();
}

process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));

main().catch((error) => {
  stopChildren();
  console.error(`No se pudo iniciar CRELEALTAD CORE: ${error.message}`);
  process.exitCode = 1;
});
