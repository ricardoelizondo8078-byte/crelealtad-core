# Compatibilidad para quien inicia desde apps/mobile.
# El runner raíz arranca API y Expo con la misma IP y el mismo puerto.
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

Push-Location $repoRoot
try {
    npm run dev
}
finally {
    Pop-Location
}
