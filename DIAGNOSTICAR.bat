@echo off
color 0B
echo ========================================
echo   DIAGNOSTICO COMPLETO
echo ========================================
echo.

echo [1] Verificando procesos Node corriendo...
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if %errorlevel% equ 0 (
    echo ADVERTENCIA: Hay procesos Node corriendo
    tasklist /FI "IMAGENAME eq node.exe"
) else (
    echo OK - No hay procesos Node
)
echo.

echo [2] Verificando puerto 3100...
netstat -ano | find ":3100" >nul
if %errorlevel% equ 0 (
    echo OK - Puerto 3100 en uso (API corriendo)
    netstat -ano | find ":3100"
) else (
    echo ERROR - Puerto 3100 libre (API NO esta corriendo)
)
echo.

echo [3] Verificando .env del mobile...
if exist "apps\mobile\.env" (
    echo OK - Archivo .env existe
    type apps\mobile\.env
) else (
    echo ERROR - Archivo .env NO existe
)
echo.

echo [4] Verificando .env de la API...
if exist "apps\api\.env" (
    echo OK - Archivo .env de API existe
    findstr /C:"NODE_ENV" apps\api\.env
) else (
    echo ERROR - Archivo .env de API NO existe
)
echo.

echo [5] Intentando conectar a la API...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3100/health' -UseBasicParsing -TimeoutSec 3; Write-Host 'OK - API responde:' -ForegroundColor Green; $r.Content } catch { Write-Host 'ERROR - API no responde' -ForegroundColor Red; Write-Host $_.Exception.Message }"
echo.

echo [6] Verificando archivos criticos del mobile...
if exist "apps\mobile\App.tsx" (
    echo OK - App.tsx existe
) else (
    echo ERROR - App.tsx NO existe
)
if exist "apps\mobile\package.json" (
    echo OK - package.json existe
) else (
    echo ERROR - package.json NO existe
)
echo.

echo [7] Verificando node_modules del mobile...
if exist "apps\mobile\node_modules" (
    echo OK - node_modules existe
) else (
    echo ERROR - node_modules NO existe
    echo SOLUCION: Ejecuta: cd apps\mobile ^&^& npm install
)
echo.

echo [8] Verificando node_modules de la API...
if exist "apps\api\node_modules" (
    echo OK - node_modules de API existe
) else (
    echo ERROR - node_modules de API NO existe
    echo SOLUCION: Ejecuta: cd apps\api ^&^& npm install
)
echo.

echo ========================================
echo   RESUMEN
echo ========================================
echo.
echo Si TODO esta OK arriba, ejecuta:
echo     REINICIAR_TODO.bat
echo.
echo Si hay ERRORES, reporta cual es el problema
echo.
pause
