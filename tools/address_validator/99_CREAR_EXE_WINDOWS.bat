@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Primero ejecuta 00_INSTALAR.bat
  pause
  exit /b 1
)
echo Instalando PyInstaller...
".venv\Scripts\python.exe" -m pip install pyinstaller
if errorlevel 1 goto :error
echo Construyendo ejecutable...
".venv\Scripts\pyinstaller.exe" --noconfirm --clean --onefile --windowed ^
  --name CRELEALTAD_ADDRESS_VALIDATOR ^
  --collect-all dotenv ^
  src\launcher.py
if errorlevel 1 goto :error
echo.
echo Ejecutable creado en:
echo dist\CRELEALTAD_ADDRESS_VALIDATOR.exe
pause
exit /b 0
:error
echo ERROR creando el ejecutable.
pause
exit /b 1
