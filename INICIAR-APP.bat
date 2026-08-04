@echo off
echo ========================================
echo  INICIANDO CRELEALTAD APP
echo ========================================
echo.

REM Detener procesos anteriores
echo [1/4] Deteniendo procesos anteriores...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Generar QR con IP actual
echo [2/4] Generando QR con IP actual...
powershell -ExecutionPolicy Bypass -File "%~dp0generar-qr.ps1"

REM Iniciar backend
echo [3/4] Iniciando backend API...
cd /d "%~dp0apps\api"
start "CRELEALTAD API" cmd /k "npm run start:dev"
timeout /t 3 /nobreak >nul

REM Iniciar app móvil
echo [4/4] Iniciando app móvil...
cd /d "%~dp0apps\mobile"
start "CRELEALTAD MOBILE" cmd /k "npx expo start --web"

echo.
echo ========================================
echo  LISTO!
echo ========================================
echo.
echo Se abrieron 3 ventanas:
echo  - Backend API (puerto 3000)
echo  - Expo Mobile (puerto 8081)
echo  - QR en navegador
echo.
echo Escanea el QR con Expo Go.
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
