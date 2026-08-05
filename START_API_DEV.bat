@echo off
echo ========================================
echo INICIANDO API EN MODO DESARROLLO
echo ========================================
echo.

cd apps\api

echo Verificando NODE_ENV...
findstr /C:"NODE_ENV=development" .env >nul
if %errorlevel% neq 0 (
    echo ADVERTENCIA: NODE_ENV no esta configurado como development
    echo Agregando NODE_ENV=development al .env
    echo NODE_ENV=development >> .env
)

echo.
echo Iniciando servidor de desarrollo...
echo BYPASS TEMPORAL ACTIVO: PIN 1234 funciona para cualquier usuario
echo.
echo Presiona Ctrl+C para detener
echo.

npm run start:dev
