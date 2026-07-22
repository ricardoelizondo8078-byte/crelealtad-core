# ============================================================
# CRELEALTAD CORE - Schema SQL v2.0
# SCRIPT MAESTRO DE MIGRACIÓN
# ============================================================

$ErrorActionPreference = "Stop"

$PSQL = "C:\Program Files\PostgreSQL\17\bin\psql.exe"
$DB = "crelealtad"
$USER = "postgres"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "CRELEALTAD CORE - Migración Schema v2.0" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Función para ejecutar SQL y mostrar resultado
function Invoke-SqlFile {
    param(
        [string]$File,
        [string]$Description
    )

    Write-Host "► $Description..." -ForegroundColor Yellow

    try {
        & $PSQL -U $USER -d $DB -f $File

        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Completado" -ForegroundColor Green
            Write-Host ""
            return $true
        } else {
            Write-Host "  ✗ Error (código $LASTEXITCODE)" -ForegroundColor Red
            Write-Host ""
            return $false
        }
    } catch {
        Write-Host "  ✗ Error: $_" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# PARTE 1: Crear tablas nuevas
if (-not (Invoke-SqlFile "01-crear-tablas-nuevas.sql" "PARTE 1: Creando 11 tablas nuevas")) {
    Write-Host "Migración abortada en Parte 1" -ForegroundColor Red
    exit 1
}

# PARTE 2: Migrar tablas existentes
if (-not (Invoke-SqlFile "02-migrar-grupos.sql" "PARTE 2.1: Migrando tabla grupos")) {
    Write-Host "Migración abortada en Parte 2.1" -ForegroundColor Red
    exit 1
}

if (-not (Invoke-SqlFile "03-migrar-expedientes.sql" "PARTE 2.2: Migrando tabla expedientes")) {
    Write-Host "Migración abortada en Parte 2.2" -ForegroundColor Red
    exit 1
}

if (-not (Invoke-SqlFile "04-migrar-integrantes.sql" "PARTE 2.3: Renombrando solicitantes a integrantes")) {
    Write-Host "Migración abortada en Parte 2.3" -ForegroundColor Red
    exit 1
}

if (-not (Invoke-SqlFile "05-migrar-solicitudes.sql" "PARTE 2.4: Migrando tabla solicitudes")) {
    Write-Host "Migración abortada en Parte 2.4" -ForegroundColor Red
    exit 1
}

# PARTE 3: Crear tablas de créditos y cobranza
if (-not (Invoke-SqlFile "06-crear-creditos-cobranza.sql" "PARTE 3: Creando tablas de créditos y cobranza")) {
    Write-Host "Migración abortada en Parte 3" -ForegroundColor Red
    exit 1
}

# PARTE 4: Datos semilla
if (-not (Invoke-SqlFile "07-seed-datos.sql" "PARTE 4: Insertando datos semilla")) {
    Write-Host "Migración abortada en Parte 4" -ForegroundColor Red
    exit 1
}

# PARTE 5: Verificación
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "VERIFICACIÓN FINAL" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

& $PSQL -U $USER -d $DB -f "08-verificacion.sql"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "✓ MIGRACIÓN COMPLETADA EXITOSAMENTE" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Revisar los resultados de verificación arriba" -ForegroundColor White
Write-Host "2. Deben existir 20 tablas en total" -ForegroundColor White
Write-Host "3. Actualizar entidades de TypeORM en el backend" -ForegroundColor White
Write-Host "4. Configurar synchronize: false en TypeORM" -ForegroundColor White
Write-Host ""
