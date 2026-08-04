@echo off
echo ========================================
echo   INICIANDO CRELEALTAD APP
echo ========================================
echo.
echo [1/3] Verificando IP actual...
for /f "usebackq tokens=*" %%a in (`powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -First 1).IPAddress"`) do set IP=%%a
echo IP detectada: %IP%
echo.

echo [2/3] Actualizando .env con IP actual...
echo EXPO_PUBLIC_API_BASE_URL=http://%IP%:3100 > apps\mobile\.env
echo ✓ .env actualizado
echo.

echo [3/3] Iniciando servidores...
echo.
echo ========================================
echo   ABRIENDO 2 VENTANAS:
echo   - Ventana 1: API (Puerto 3100)
echo   - Ventana 2: Expo (Puerto 8081)
echo ========================================
echo.

start "API - CRELEALTAD" cmd /k "cd /d %~dp0apps\api && npm run start:dev"
timeout /t 3 /nobreak >nul

start "EXPO - CRELEALTAD" cmd /k "cd /d %~dp0apps\mobile && npx expo start --lan"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo ✓ Servidores iniciados
echo.
echo   API:  http://localhost:3100
echo   EXPO: http://localhost:8081
echo.
echo   Abriendo QR en 5 segundos...
echo ========================================
timeout /t 5 /nobreak >nul

start "" "%~dp0QR-DEFINITIVO.html"

echo.
echo IMPORTANTE:
echo - NO CIERRES las ventanas de API y EXPO
echo - Minimizalas si quieres
echo - Para detener: cierra ambas ventanas
echo.
pause
