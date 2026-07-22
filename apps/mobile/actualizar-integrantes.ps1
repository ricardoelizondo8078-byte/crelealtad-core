# Script para reemplazar todas las referencias de solicitantes a integrantes

$archivos = @(
    "src\features\integrantes\IntegranteFormScreen.tsx",
    "src\features\expedientes\ExpedienteDetailScreen.tsx",
    "src\features\solicitudes\SolicitudFormScreen.tsx",
    "src\features\documentos\DocumentosScreen.tsx"
)

$basePath = "C:\Users\Admin\Desktop\CRELEALTAD CORE\apps\mobile"

foreach ($archivo in $archivos) {
    $fullPath = Join-Path $basePath $archivo

    if (Test-Path $fullPath) {
        Write-Host "Procesando: $archivo" -ForegroundColor Yellow

        $content = Get-Content $fullPath -Raw -Encoding UTF8

        # Reemplazos de rutas API
        $content = $content -replace '/solicitantes/', '/integrantes/'
        $content = $content -replace '/solicitante/', '/integrante/'

        # Reemplazos de variables y propiedades
        $content = $content -replace 'solicitanteId', 'integranteId'
        $content = $content -replace 'solicitanteNombre', 'integranteNombre'
        $content = $content -replace 'solicitanteData', 'integranteData'
        $content = $content -replace 'solicitanteResponse', 'integranteResponse'
        $content = $content -replace 'solicitanteCard', 'integranteCard'
        $content = $content -replace 'solicitanteHeader', 'integranteHeader'
        $content = $content -replace 'solicitanteName', 'integranteName'
        $content = $content -replace 'solicitanteMeta', 'integranteMeta'
        $content = $content -replace '\$solicitante', '$integrante'
        $content = $content -replace 'solicitantes\.', 'integrantes.'
        $content = $content -replace '\(solicitante\)', '(integrante)'
        $content = $content -replace ', solicitante\)', ', integrante)'
        $content = $content -replace 'solicitantes\[', 'integrantes['
        $content = $content -replace 'solicitantes\.map', 'integrantes.map'
        $content = $content -replace 'solicitantes\.filter', 'integrantes.filter'
        $content = $content -replace 'solicitantes\.length', 'integrantes.length'
        $content = $content -replace 'setSolicitantes', 'setIntegrantes'
        $content = $content -replace 'setSolicitante', 'setIntegrante'

        # Reemplazos de tipos y componentes
        $content = $content -replace 'SolicitanteFormScreen', 'IntegranteFormScreen'
        $content = $content -replace 'SolicitanteStatusViewModel', 'IntegranteStatusViewModel'
        $content = $content -replace 'SolicitanteInfo', 'IntegranteInfo'

        # Reemplazos en comentarios y strings (solo algunos casos específicos)
        $content = $content -replace 'solicitantes\)', 'integrantes)'
        $content = $content -replace 'Agregar solicitante', 'Agregar integrante'
        $content = $content -replace 'del solicitante', 'del integrante'
        $content = $content -replace 'solicitante\(', 'integrante('
        $content = $content -replace 'Solicitante-', 'Integrante-'
        $content = $content -replace 'los datos básicos de la solicitante', 'los datos básicos del integrante'
        $content = $content -replace 'datos básicos de identidad \(fuente: tabla solicitantes\)', 'datos básicos de identidad (fuente: tabla integrantes)'
        $content = $content -replace 'básicos van a solicitantes', 'básicos van a integrantes'
        $content = $content -replace 'tabla solicitantes', 'tabla integrantes'
        $content = $content -replace 'Tarjeta del solicitante', 'Tarjeta del integrante'
        $content = $content -replace 'Datos iniciales \(pre-cargados del solicitante\)', 'Datos iniciales (pre-cargados del integrante)'
        $content = $content -replace 'Datos básicos SIEMPRE vienen de solicitanteData \(tabla solicitantes\)', 'Datos básicos SIEMPRE vienen de integranteData (tabla integrantes)'
        $content = $content -replace 'montoFromSolicitante', 'montoFromIntegrante'
        $content = $content -replace 'handleLlamarSolicitante', 'handleLlamarIntegrante'
        $content = $content -replace 'Campos iniciales del solicitante', 'Campos iniciales del integrante'
        $content = $content -replace 'Al menos 1 solicitante completa', 'Al menos 1 integrante completa'
        $content = $content -replace 'solicitante\(s\) pendiente', 'integrante(s) pendiente'
        $content = $content -replace 'Aún no hay solicitantes', 'Aún no hay integrantes'
        $content = $content -replace 'para este expediente', 'para este expediente'

        # Guardar
        Set-Content -Path $fullPath -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✅ Actualizado: $archivo" -ForegroundColor Green
    } else {
        Write-Host "❌ No encontrado: $fullPath" -ForegroundColor Red
    }
}

Write-Host "`n✅ Proceso completado" -ForegroundColor Cyan
