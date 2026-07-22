# CRELEALTAD CORE - Schema SQL v2.0 - Script de Migracion

$ErrorActionPreference = "Stop"

$PSQL = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$DB = "crelealtad"
$USER = "postgres"

Write-Host "CRELEALTAD CORE - Migracion Schema v2.0" -ForegroundColor Cyan
Write-Host ""

Write-Host "PARTE 1: Creando tablas nuevas..." -ForegroundColor Yellow
& $PSQL -U $USER -d $DB -f "01-crear-tablas-nuevas.sql"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "PARTE 2.1: Migrando tabla grupos..." -ForegroundColor Yellow
& $PSQL -U $USER -d $DB -f "02-migrar-grupos.sql"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "PARTE 2.2: Migrando tabla expedientes..." -ForegroundColor Yellow
& $PSQL -U $USER -d $DB -f "03-migrar-expedientes.sql"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "PARTE 2.3: Renombrando solicitantes a integrantes..." -ForegroundColor Yellow
& $PSQL -U $USER -d $DB -f "04-migrar-integrantes.sql"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "PARTE 2.4: Migrando tabla solicitudes..." -ForegroundColor Yellow
& $PSQL -U $USER -d $DB -f "05-migrar-solicitudes.sql"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "PARTE 3: Creando tablas de creditos y cobranza..." -ForegroundColor Yellow
& $PSQL -U $USER -d $DB -f "06-crear-creditos-cobranza.sql"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "PARTE 4: Insertando datos semilla..." -ForegroundColor Yellow
& $PSQL -U $USER -d $DB -f "07-seed-datos.sql"
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "VERIFICACION FINAL" -ForegroundColor Cyan
& $PSQL -U $USER -d $DB -f "08-verificacion.sql"

Write-Host ""
Write-Host "MIGRACION COMPLETADA" -ForegroundColor Green
Write-Host ""
