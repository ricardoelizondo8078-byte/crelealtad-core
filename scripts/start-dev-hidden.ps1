[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot '.runtime'
$eventsLog = Join-Path $runtimeDirectory 'dev-autostart-events.log'
$runsDirectory = Join-Path $runtimeDirectory 'dev-runs'
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$runnerPath = Join-Path $projectRoot 'scripts\dev-runner.js'

New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
New-Item -ItemType Directory -Path $runsDirectory -Force | Out-Null

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
    try {
      # Cada ejecución usa archivos distintos. Metro y Nest pueden conservar
      # descendientes con el log anterior abierto; reutilizarlo hacía fallar el
      # siguiente Start-Process y terminaba también este vigilante.
      $runId = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
      $standardLog = Join-Path $runsDirectory "dev-$runId.log"
      $errorLog = Join-Path $runsDirectory "dev-$runId-error.log"

      Add-Content -LiteralPath $eventsLog -Value "$(Get-Date -Format o) Iniciando supervisor remoto oculto."
      $process = Start-Process `
        -FilePath $nodePath `
        -ArgumentList @('"' + $runnerPath + '"', '--tailscale') `
        -WorkingDirectory $projectRoot `
        -RedirectStandardOutput $standardLog `
        -RedirectStandardError $errorLog `
        -WindowStyle Hidden `
        -PassThru

      # Start-Process -Wait puede quedarse esperando descendientes huerfanos en
      # Windows aun cuando el supervisor Node ya termino. WaitForExit observa
      # exclusivamente el proceso que debemos reiniciar.
      $process.WaitForExit()
      $exitCode = $process.ExitCode

      Add-Content -LiteralPath $eventsLog -Value "$(Get-Date -Format o) El supervisor remoto terminó con código $exitCode; reintento en 3 segundos."
    } catch {
      # Un error transitorio al iniciar o registrar el proceso no debe apagar
      # el vigilante completo.
      Add-Content -LiteralPath $eventsLog -Value "$(Get-Date -Format o) Error del vigilante: $($_.Exception.Message); reintento en 3 segundos."
    }
    Start-Sleep -Seconds 3
  }
} finally {
  $mutex.ReleaseMutex()
  $mutex.Dispose()
}
