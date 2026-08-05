@echo off
color 0E
echo ========================================
echo   REINICIO COMPLETO - MODO DESARROLLO
echo ========================================
echo.

REM Matar TODOS los procesos
echo [1/5] Matando procesos...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM expo.exe /T >nul 2>&1
timeout /t 3 /nobreak >nul
echo OK - Procesos terminados
echo.

REM Detectar IP
echo [2/5] Detectando IP de red...
for /f "usebackq tokens=*" %%a in (`powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -First 1).IPAddress"`) do set IP=%%a
if "%IP%"=="" set IP=192.168.1.100
echo OK - IP: %IP%
echo.

REM Actualizar .env del mobile
echo [3/5] Actualizando .env del mobile...
echo EXPO_PUBLIC_API_BASE_URL=http://%IP%:3100 > apps\mobile\.env
echo OK - .env actualizado:
type apps\mobile\.env
echo.

REM Verificar .env de la API
echo [4/5] Verificando .env de la API...
findstr /C:"NODE_ENV=development" apps\api\.env >nul
if %errorlevel% neq 0 (
    echo ADVERTENCIA: Agregando NODE_ENV=development
    echo NODE_ENV=development >> apps\api\.env
)
echo OK - NODE_ENV configurado como development
echo.

REM Iniciar API
echo [5/5] Iniciando servicios...
echo.
echo Iniciando API en puerto 3100...
start "API DEV - CRELEALTAD" cmd /k "cd /d %~dp0apps\api && echo BYPASS TEMPORAL ACTIVO: PIN 1234 && npm run start:dev"
timeout /t 8 /nobreak >nul

REM Verificar API
echo Verificando API...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3100/health' -UseBasicParsing -TimeoutSec 5; Write-Host 'OK - API respondiendo en puerto 3100' -ForegroundColor Green } catch { Write-Host 'ERROR - API no responde' -ForegroundColor Red; Write-Host 'Verifica la ventana de la API para ver errores' }"
echo.

REM Iniciar Expo en MODO DESARROLLO (sin --no-dev)
echo Iniciando Expo en modo desarrollo...
start "EXPO DEV - CRELEALTAD" cmd /k "cd /d %~dp0apps\mobile && npx expo start --clear"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   SERVICIOS INICIADOS
echo ========================================
echo.
echo API:  http://%IP%:3100
echo Expo: Esperando QR en la ventana de Expo
echo.
echo ========================================
echo   CREDENCIALES DE LOGIN
echo ========================================
echo.
echo Email: admin@crelealtad.com
echo PIN:   1234
echo.
echo IMPORTANTE: Este PIN es TEMPORAL solo para desarrollo
echo Ver: SECURITY_PENDING.md
echo.
echo ========================================
echo   SI LA APP NO CARGA
echo ========================================
echo.
echo 1. Verifica que ambas ventanas esten abiertas (API y Expo)
echo 2. En la ventana de Expo, busca errores en rojo
echo 3. En la ventana de API, busca errores en rojo
echo 4. Si ves errores, copia el mensaje y reportalo
echo.
pause
