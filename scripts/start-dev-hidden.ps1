[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot '.runtime'
$eventsLog = Join-Path $runtimeDirectory 'dev-autostart-events.log'
$standardLog = Join-Path $runtimeDirectory 'dev-autostart.log'
$errorLog = Join-Path $runtimeDirectory 'dev-autostart-error.log'
$npmPath = (Get-Command npm.cmd -ErrorAction Stop).Source

New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null

$createdNew = $false
$mutex = New-Object System.Threading.Mutex(
  $true,
  'Local\CRELEALTAD_CORE_DEV_AUTOSTART',
  [ref]$createdNew
)

if (-not $createdNew) {
  Add-Content -LiteralPath $eventsLog -Value "$(Get-Date -Format o) Autoarranque ya activo."
  $mutex.Dispose()
  exit 0
}

try {
  while ($true) {
    Add-Content -LiteralPath $eventsLog -Value "$(Get-Date -Format o) Iniciando npm run dev:tailscale."
    $process = Start-Process `
      -FilePath $npmPath `
      -ArgumentList @('run', 'dev:tailscale') `
      -WorkingDirectory $projectRoot `
      -RedirectStandardOutput $standardLog `
      -RedirectStandardError $errorLog `
      -Wait `
      -PassThru
    $exitCode = $process.ExitCode

    Add-Content -LiteralPath $eventsLog -Value "$(Get-Date -Format o) npm run dev:tailscale terminó con código $exitCode; reintento en 10 segundos."
    Start-Sleep -Seconds 10
  }
} finally {
  $mutex.ReleaseMutex()
  $mutex.Dispose()
}
