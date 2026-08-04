@echo off
echo ========================================
echo   REINICIANDO EXPO COMPLETAMENTE
echo ========================================
echo.

echo [1/3] Deteniendo procesos de Metro...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Limpiando cache de Expo...
cd /d "%~dp0apps\mobile"
rmdir /s /q .expo 2>nul
rmdir /s /q node_modules\.cache 2>nul
echo Cache limpiado

echo.
echo [3/3] Iniciando Expo con cache limpio...
start "EXPO - CRELEALTAD" cmd /k "npx expo start --clear --lan"

echo.
echo ========================================
echo   EXPO REINICIADO
echo ========================================
echo.
echo IMPORTANTE:
echo - Escanea el QR de nuevo desde Expo Go
echo - Los cambios de estilo ahora deben aparecer
echo.
pause
