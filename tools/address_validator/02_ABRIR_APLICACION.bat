@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".venv\Scripts\pythonw.exe" (
  echo Primero ejecuta 00_INSTALAR.bat
  pause
  exit /b 1
)
start "" ".venv\Scripts\pythonw.exe" -m src.app
exit /b 0
