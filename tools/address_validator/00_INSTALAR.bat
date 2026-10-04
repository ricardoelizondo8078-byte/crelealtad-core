@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"

echo ===============================================================
echo CRELEALTAD ADDRESS VALIDATOR V3 - INSTALACION
echo ===============================================================
echo.

py -3.13 --version >nul 2>nul
if errorlevel 1 (
  echo ERROR: No se encontro Python 3.13 mediante "py -3.13".
  echo En CMD verifica: py -3.13 --version
  pause
  exit /b 1
)

echo Python:
py -3.13 --version
echo.

if not exist "requirements.txt" (
  echo ERROR: Falta requirements.txt.
  echo Vuelve a extraer COMPLETO el ZIP V3.
  pause
  exit /b 1
)

if not exist "src\app.py" (
  echo ERROR: Falta src\app.py.
  echo Vuelve a extraer COMPLETO el ZIP V3.
  pause
  exit /b 1
)

if not exist ".venv\Scripts\python.exe" (
  echo Creando entorno virtual...
  py -3.13 -m venv .venv
  if errorlevel 1 goto :error
)

echo Actualizando pip...
".venv\Scripts\python.exe" -m pip install --upgrade pip
if errorlevel 1 goto :error

echo Instalando dependencias...
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 goto :error

echo.
echo ===============================================================
echo INSTALACION TERMINADA CORRECTAMENTE
echo ===============================================================
echo Siguiente paso: ejecuta 01_CONFIGURAR.bat
pause
exit /b 0

:error
echo.
echo ERROR DURANTE LA INSTALACION.
pause
exit /b 1
