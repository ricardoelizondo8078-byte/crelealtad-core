@echo off
color 0A
echo ========================================
echo   SOLUCION DEFINITIVA - CACHE LIMPIO
echo ========================================
echo.

REM Matar TODOS los procesos
echo [1/8] Matando TODOS los procesos Node/Expo...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM expo.exe /T >nul 2>&1
taskkill /F /IM watchman.exe /T >nul 2>&1
timeout /t 3 /nobreak >nul
echo ✓ Procesos terminados

REM Detectar IP
echo.
echo [2/8] Detectando IP de red...
for /f "usebackq tokens=*" %%a in (`powershell -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -First 1).IPAddress"`) do set IP=%%a
echo ✓ IP: %IP%

REM Actualizar .env
echo.
echo [3/8] Actualizando .env...
echo EXPO_PUBLIC_API_BASE_URL=http://%IP%:3100 > apps\mobile\.env
type apps\mobile\.env
echo ✓ .env actualizado

REM Limpiar ABSOLUTAMENTE TODO
echo.
echo [4/8] LIMPIANDO TODO EL CACHE (esto tomara unos segundos)...
cd /d "%~dp0apps\mobile"
rmdir /s /q .expo 2>nul
rmdir /s /q .metro 2>nul
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q android\.gradle 2>nul
rmdir /s /q ios\build 2>nul
cd /d "%~dp0"
rmdir /s /q "%LOCALAPPDATA%\Temp\metro-*" 2>nul
rmdir /s /q "%LOCALAPPDATA%\Temp\haste-map-*" 2>nul
rmdir /s /q "%LOCALAPPDATA%\Temp\react-*" 2>nul
del /f /q "%LOCALAPPDATA%\Temp\metro*" 2>nul
del /f /q "%LOCALAPPDATA%\Temp\haste*" 2>nul
echo ✓ Cache TOTALMENTE limpio

REM Watchman
echo.
echo [5/8] Limpiando Watchman...
watchman watch-del-all 2>nul
echo ✓ Watchman limpio

REM Iniciar API
echo.
echo [6/8] Iniciando API en puerto 3100...
start "API - CRELEALTAD" cmd /k "cd /d %~dp0apps\api && npm run start:dev"
timeout /t 10 /nobreak >nul

REM Verificar API
powershell -Command "$ok = $false; for($i=0; $i -lt 3; $i++) { try { Invoke-WebRequest -Uri 'http://%IP%:3100/health' -UseBasicParsing -TimeoutSec 3 | Out-Null; $ok = $true; break } catch { Start-Sleep -Seconds 2 } } if($ok) { Write-Host '✓ API funcionando' -ForegroundColor Green } else { Write-Host '✗ API no responde' -ForegroundColor Red }"

REM Iniciar Expo LIMPIO
echo.
echo [7/8] Iniciando Expo con cache COMPLETAMENTE limpio...
start "EXPO - CRELEALTAD" cmd /k "cd /d %~dp0apps\mobile && npx expo start --clear --reset-cache --no-dev --minify"
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo [8/8] VERIFICACION FINAL
echo ========================================
echo.
echo ✓ API iniciada en: http://%IP%:3100
echo ✓ Expo iniciado (espera el QR)
echo ✓ Archivo nuevo: DocumentosScreenV2.tsx
echo.
echo ========================================
echo   PASOS EN TU CELULAR (IMPORTANTE)
echo ========================================
echo.
echo 1. CIERRA Expo Go COMPLETAMENTE (multitarea)
echo.
echo 2. BORRA EL CACHE DE EXPO GO:
echo    Android: Config ^> Apps ^> Expo Go ^> Almacenamiento
echo             ^> BORRAR CACHE Y DATOS
echo    iOS: DESINSTALA y REINSTALA Expo Go
echo.
echo 3. Abre Expo Go LIMPIO
echo.
echo 4. Escanea el QR DE NUEVO
echo.
echo 5. VERIFICACION:
echo    - Titulo debe decir: "🔥 DOCUMENTOS NUEVO 🔥"
echo    - Al ver documento: texto rojo "VERSION 2.0"
echo    - NO debe haber boton Cerrar abajo
echo.
echo Si NO ves el titulo con 🔥, el cache sigue activo
echo.
echo ========================================

pause
