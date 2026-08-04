@echo off
echo ========================================
echo   FORZANDO RECARGA COMPLETA DE MOBILE
echo ========================================
echo.

REM Matar todos los procesos Node/Expo
echo [1/5] Deteniendo procesos...
taskkill /F /IM node.exe /T >nul 2>&1
taskkill /F /IM expo.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

REM Limpiar cache local
echo [2/5] Limpiando cache local...
cd /d "%~dp0apps\mobile"
rmdir /s /q .expo >nul 2>&1
rmdir /s /q node_modules\.cache >nul 2>&1
rmdir /s /q .metro >nul 2>&1

REM Limpiar cache global de Metro
echo [3/5] Limpiando cache global...
rmdir /s /q "%LOCALAPPDATA%\Temp\metro-cache-*" >nul 2>&1
rmdir /s /q "%LOCALAPPDATA%\Temp\haste-map-*" >nul 2>&1
rmdir /s /q "%LOCALAPPDATA%\Temp\react-*" >nul 2>&1
del /f /q "%LOCALAPPDATA%\Temp\metro-*" >nul 2>&1

REM Limpiar watchman si existe
echo [4/5] Limpiando watchman...
watchman watch-del-all >nul 2>&1

REM Iniciar Expo con todo limpio
echo [5/5] Iniciando Expo...
echo.
echo IMPORTANTE:
echo 1. En tu celular, CIERRA COMPLETAMENTE la app Expo Go
echo 2. NO LA MINIMICES, ciérrala desde el multitarea
echo 3. Cuando aparezca el QR, escanéalo de nuevo
echo.
echo ========================================
echo.

npx expo start --clear --reset-cache

pause
