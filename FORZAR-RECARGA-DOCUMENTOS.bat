@echo off
echo ========================================
echo   FORZANDO RECARGA DE DOCUMENTOS SCREEN
echo ========================================
echo.

echo [1/4] Tocando archivo para forzar recompilacion...
cd /d "%~dp0apps\mobile\src\features\documentos"
copy /b DocumentosScreen.tsx +,, >nul

echo [2/4] Limpiando cache de Metro...
cd /d "%~dp0apps\mobile"
rmdir /s /q .expo >nul 2>&1
rmdir /s /q node_modules\.cache >nul 2>&1
del /f /q "%LOCALAPPDATA%\Temp\metro-*" >nul 2>&1

echo [3/4] Reiniciando bundler...
echo.
echo PRESIONA 'r' EN LA CONSOLA DE EXPO PARA RECARGAR
echo.
echo O en tu celular:
echo 1. Sacude el dispositivo
echo 2. Selecciona "Reload"
echo.
echo [4/4] Verificaciones:
echo.
echo Si el codigo nuevo esta cargando, deberas ver:
echo   ✓ Titulo: "Documentos V2.0" (con V2.0)
echo   ✓ Texto rojo: "VERSION 2.0 - SIN BOTON ABAJO"
echo   ✓ NO debe aparecer boton Cerrar abajo
echo.
echo Si NO ves "V2.0" en el titulo, el cache sigue activo.
echo.

pause
