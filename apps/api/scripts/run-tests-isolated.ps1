$ErrorActionPreference = 'Stop'

$postgresBin = if ($env:POSTGRES_BIN) {
  [System.IO.Path]::GetFullPath($env:POSTGRES_BIN)
} else {
  'C:\Program Files\PostgreSQL\17\bin'
}
$initDb = Join-Path $postgresBin 'initdb.exe'
$pgCtl = Join-Path $postgresBin 'pg_ctl.exe'
$psql = Join-Path $postgresBin 'psql.exe'
$createDb = Join-Path $postgresBin 'createdb.exe'
$repositoryRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$apiDirectory = Join-Path $repositoryRoot 'apps\api'
$schemaDump = Join-Path $repositoryRoot 'database\schema-dump.sql'
$temporaryRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())
$clusterName = 'crelealtad-core-pg-' + [guid]::NewGuid().ToString('N')
$clusterDirectory = Join-Path $temporaryRoot $clusterName
$logPath = Join-Path $clusterDirectory 'postgres.log'
$clusterStarted = $false
$testExitCode = 1

foreach ($requiredPath in @($initDb, $pgCtl, $psql, $createDb, $schemaDump)) {
  if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
    throw "Dependencia requerida no encontrada: $requiredPath"
  }
}

$listener = [System.Net.Sockets.TcpListener]::new(
  [System.Net.IPAddress]::Loopback,
  0
)
$listener.Start()
$port = ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
$listener.Stop()

try {
  New-Item -ItemType Directory -Path $clusterDirectory | Out-Null

  & $initDb `
    --pgdata=$clusterDirectory `
    --username=postgres `
    --encoding=UTF8 `
    --auth-local=trust `
    --auth-host=trust `
    --no-sync
  if ($LASTEXITCODE -ne 0) {
    throw 'No fue posible inicializar el PostgreSQL aislado'
  }

  & $pgCtl `
    --pgdata=$clusterDirectory `
    --log=$logPath `
    --options="-p $port -h 127.0.0.1" `
    --wait `
    start
  if ($LASTEXITCODE -ne 0) {
    throw 'No fue posible iniciar el PostgreSQL aislado'
  }
  $clusterStarted = $true

  & $createDb `
    --host=127.0.0.1 `
    --port=$port `
    --username=postgres `
    crelealtad_test
  if ($LASTEXITCODE -ne 0) {
    throw 'No fue posible crear crelealtad_test en el clúster aislado'
  }

  & $psql `
    --host=127.0.0.1 `
    --port=$port `
    --username=postgres `
    --dbname=crelealtad_test `
    --set=ON_ERROR_STOP=1 `
    --file=$schemaDump
  if ($LASTEXITCODE -ne 0) {
    throw 'No fue posible cargar el esquema verificado'
  }

  $env:DB_HOST = '127.0.0.1'
  $env:DB_PORT = $port.ToString()
  $env:DB_USER = 'postgres'
  $env:DB_USERNAME = 'postgres'
  $env:DB_PASSWORD = 'isolated-development-cluster'
  $env:DB_NAME = 'crelealtad_test'

  Push-Location $apiDirectory
  try {
    & npm test -- --runInBand
    $testExitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  Remove-Item Env:DB_HOST -ErrorAction SilentlyContinue
  Remove-Item Env:DB_PORT -ErrorAction SilentlyContinue
  Remove-Item Env:DB_USER -ErrorAction SilentlyContinue
  Remove-Item Env:DB_USERNAME -ErrorAction SilentlyContinue
  Remove-Item Env:DB_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:DB_NAME -ErrorAction SilentlyContinue

  if ($clusterStarted) {
    & $pgCtl --pgdata=$clusterDirectory --mode=fast --wait stop | Out-Null
  }

  $resolvedCluster = [System.IO.Path]::GetFullPath($clusterDirectory)
  $isExpectedTemporaryPath =
    $resolvedCluster.StartsWith($temporaryRoot, [System.StringComparison]::OrdinalIgnoreCase) -and
    ([System.IO.Path]::GetFileName($resolvedCluster)).StartsWith(
      'crelealtad-core-pg-',
      [System.StringComparison]::Ordinal
    )

  if (-not $isExpectedTemporaryPath) {
    throw "Ruta temporal inesperada; no se eliminó: $resolvedCluster"
  }

  if (Test-Path -LiteralPath $resolvedCluster) {
    Remove-Item -LiteralPath $resolvedCluster -Recurse -Force
  }
}

exit $testExitCode
