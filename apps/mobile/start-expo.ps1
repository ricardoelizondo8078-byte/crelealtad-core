# Script para iniciar Expo con IP automática
Write-Host "🚀 Iniciando Expo con detección automática de IP..." -ForegroundColor Cyan

# Detectar IP local
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -like '192.168.*' -or
    $_.IPAddress -like '10.*' -or
    $_.IPAddress -like '172.*'
} | Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "❌ No se pudo detectar la IP local" -ForegroundColor Red
    exit 1
}

Write-Host "✅ IP detectada: $ip" -ForegroundColor Green

# Actualizar .env
$envContent = "EXPO_PUBLIC_API_BASE_URL=http://$($ip):3000"
Set-Content -Path ".env" -Value $envContent
Write-Host "✅ Archivo .env actualizado" -ForegroundColor Green

# Mostrar QR en consola
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host "  📱 CONEXIÓN EXPO GO" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""
Write-Host "  URL: exp://$($ip):8081" -ForegroundColor White
Write-Host ""
Write-Host "  💡 OPCIONES:" -ForegroundColor Cyan
Write-Host "     1. Escanea el QR que aparecerá abajo" -ForegroundColor White
Write-Host "     2. Ingresa manualmente en Expo Go:" -ForegroundColor White
Write-Host "        exp://$($ip):8081" -ForegroundColor Yellow
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Magenta
Write-Host ""

# Iniciar Expo
npx expo start --clear
