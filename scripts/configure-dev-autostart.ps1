[CmdletBinding()]
param(
  [switch]$Remove
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$launcherPath = Join-Path $PSScriptRoot 'start-dev-hidden.ps1'
$startupDirectory = [Environment]::GetFolderPath('Startup')
$shortcutPath = Join-Path $startupDirectory 'CRELEALTAD CORE Dev.lnk'

if ($Remove) {
  if (Test-Path -LiteralPath $shortcutPath) {
    Remove-Item -LiteralPath $shortcutPath -Force
  }
  Write-Host "Autoarranque retirado: $shortcutPath"
  exit 0
}

if (-not (Test-Path -LiteralPath $launcherPath)) {
  throw "No existe el iniciador: $launcherPath"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = (Get-Command powershell.exe -ErrorAction Stop).Source
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`""
$shortcut.WorkingDirectory = $projectRoot
$shortcut.Description = 'Supervisa automáticamente la API y Expo de CRELEALTAD CORE por Tailscale.'
$shortcut.Save()

Write-Host "Autoarranque instalado: $shortcutPath"
