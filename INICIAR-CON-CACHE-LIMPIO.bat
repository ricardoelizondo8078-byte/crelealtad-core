@echo off
echo ========================================
echo   INICIANDO CON CACHE COMPLETAMENTE LIMPIO
echo ========================================
echo.

REM Matar todos los procesos
echo [1/6] Deteniendo procesos anteriores...
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

REM Detectar IP
echo [2/6] Detectando IP...
for /f "usebackq tokens=*" %%a in (`powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -First 1).IPAddress"`) do set IP=%%a
echo IP detectada: %IP%
echo.

REM Actualizar .env
echo [3/6] Actualizando .env...
echo EXPO_PUBLIC_API_BASE_URL=http://%IP%:3100 > apps\mobile\.env
echo.

REM Limpiar TODO el cache
echo [4/6] Limpiando TODOS los caches...
cd /d "%~dp0apps\mobile"
rmdir /s /q .expo >nul 2>&1
rmdir /s /q node_modules\.cache >nul 2>&1
rmdir /s /q .metro >nul 2>&1
rmdir /s /q "%LOCALAPPDATA%\Temp\metro-*" >nul 2>&1
rmdir /s /q "%LOCALAPPDATA%\Temp\haste-map-*" >nul 2>&1
rmdir /s /q "%LOCALAPPDATA%\Temp\react-*" >nul 2>&1
echo Cache limpiado completamente
echo.

REM Iniciar API
echo [5/6] Iniciando API en puerto 3100...
cd /d "%~dp0"
start "API - CRELEALTAD" cmd /k "cd /d %~dp0apps\api && npm run start:dev"
timeout /t 10 /nobreak >nul

REM Verificar API
echo Verificando API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://%IP%:3100/health' -UseBasicParsing -TimeoutSec 5; Write-Host 'API OK' -ForegroundColor Green } catch { Write-Host 'ADVERTENCIA: API no responde' -ForegroundColor Red }"
echo.

REM Iniciar Mobile
echo [6/6] Iniciando Mobile con cache limpio...
start "MOBILE - EXPO" cmd /k "cd /d %~dp0apps\mobile && npx expo start --clear --reset-cache"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ✓ INICIADO CON CACHE LIMPIO
echo ========================================
echo.
echo   API:    http://%IP%:3100
echo   Mobile: Escanea el QR en la ventana EXPO
echo.
echo IMPORTANTE EN TU CELULAR:
echo 1. CIERRA COMPLETAMENTE Expo Go (multitarea)
echo 2. BORRA el cache de Expo Go:
echo    - Android: Config ^> Apps ^> Expo Go ^> Borrar cache
echo    - iOS: Desinstala y reinstala Expo Go
echo 3. Abre Expo Go y escanea el QR DE NUEVO
echo.

pause
