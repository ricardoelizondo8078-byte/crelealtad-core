@echo off
echo ========================================
echo   INICIANDO CRELEALTAD APP (MEJORADO)
echo ========================================
echo.

REM Detectar IP actual
echo [1/4] Detectando IP actual...
for /f "usebackq tokens=*" %%a in (`powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -First 1).IPAddress"`) do set IP=%%a
echo IP detectada: %IP%
echo.

REM Actualizar .env
echo [2/4] Actualizando .env...
echo EXPO_PUBLIC_API_BASE_URL=http://%IP%:3100 > apps\mobile\.env
echo Contenido de .env:
type apps\mobile\.env
echo.

REM Verificar y limpiar puerto 3100
echo [3/4] Verificando puerto 3100...
powershell -Command "$port = 3100; $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue; if ($conn) { Write-Output 'Puerto 3100 ocupado, liberando...'; $conn | ForEach-Object { $pid = $_.OwningProcess; Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }; Start-Sleep -Seconds 2 } else { Write-Output 'Puerto 3100 disponible' }"
echo.

REM Verificar regla de firewall
echo [4/4] Verificando firewall...
powershell -Command "$rule = Get-NetFirewallRule -DisplayName 'CRELEALTAD API*' -ErrorAction SilentlyContinue; if ($rule) { Write-Output 'Regla de firewall OK' } else { Write-Output 'ADVERTENCIA: Regla de firewall no encontrada. Ejecuta como administrador:'; Write-Output 'New-NetFirewallRule -DisplayName \"CRELEALTAD API Port 3100\" -Direction Inbound -LocalPort 3100 -Protocol TCP -Action Allow' }"
echo.

echo ========================================
echo   INICIANDO SERVIDORES
echo ========================================
echo.

REM Iniciar API
start "API - CRELEALTAD" cmd /k "cd /d %~dp0apps\api && npm run start:dev"
echo Esperando que API inicie...
timeout /t 8 /nobreak >nul

REM Verificar que API responde
echo Verificando API...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://%IP%:3100/health' -UseBasicParsing -TimeoutSec 5; Write-Output 'API funcionando correctamente' } catch { Write-Output 'ADVERTENCIA: API no responde en http://%IP%:3100' }"
echo.

REM Iniciar Expo con cache limpia
echo Limpiando cache de Expo...
rmdir /s /q "%~dp0apps\mobile\.expo" 2>nul
rmdir /s /q "%~dp0apps\mobile\node_modules\.cache" 2>nul
start "EXPO - CRELEALTAD" cmd /k "cd /d %~dp0apps\mobile && npx expo start --clear --lan"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ✓ SERVIDORES INICIADOS
echo ========================================
echo.
echo   API:  http://%IP%:3100
echo   EXPO: Escanea el QR en la ventana de Expo
echo.
echo IMPORTANTE:
echo - NO CIERRES las ventanas de API y EXPO
echo - Si los usuarios no aparecen, verifica el firewall
echo.

timeout /t 5 /nobreak >nul
start "" "%~dp0QR-DEFINITIVO.html"

pause
