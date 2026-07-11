# Script maestro para iniciar todo el proyecto CRELEALTAD CORE
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  🚀 CRELEALTAD CORE - INICIO AUTOMÁTICO" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Detectar IP local
Write-Host "🔍 Detectando IP local..." -ForegroundColor White
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -like '192.168.*' -or
    $_.IPAddress -like '10.*' -or
    $_.IPAddress -like '172.*'
} | Select-Object -First 1).IPAddress

if (-not $ip) {
    Write-Host "❌ No se pudo detectar la IP local" -ForegroundColor Red
    Read-Host "Presiona Enter para salir"
    exit 1
}

Write-Host "✅ IP detectada: $ip" -ForegroundColor Green
Write-Host ""

# Actualizar .env de mobile
Write-Host "📝 Actualizando configuración mobile..." -ForegroundColor White
$envContent = "EXPO_PUBLIC_API_BASE_URL=http://$($ip):3000"
Set-Content -Path "apps\mobile\.env" -Value $envContent
Write-Host "✅ Configuración actualizada" -ForegroundColor Green
Write-Host ""

# Iniciar API
Write-Host "🔧 Iniciando API en puerto 3000..." -ForegroundColor White
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Admin\Desktop\CRELEALTAD CORE\apps\api'; Write-Host '🔧 API CRELEALTAD CORE' -ForegroundColor Cyan; npm start"
Start-Sleep -Seconds 3
Write-Host "✅ API iniciada" -ForegroundColor Green
Write-Host ""

# Iniciar Expo en modo TÚNEL (funciona en cualquier red)
Write-Host "📱 Iniciando Expo en MODO TÚNEL..." -ForegroundColor White
Write-Host "   (Funciona en cualquier WiFi/Datos)" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Admin\Desktop\CRELEALTAD CORE\apps\mobile'; Write-Host '📱 EXPO CRELEALTAD CORE' -ForegroundColor Cyan; npx expo start --tunnel --clear"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  ✅ SERVIDORES INICIADOS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "  📱 En tu celular:" -ForegroundColor Cyan
Write-Host "     1. Abre Expo Go" -ForegroundColor White
Write-Host "     2. Escanea el QR que aparece en la ventana EXPO" -ForegroundColor White
Write-Host "     3. El modo TÚNEL funciona en CUALQUIER red" -ForegroundColor Yellow
Write-Host ""
Write-Host "  🌐 API corriendo en: http://$($ip):3000" -ForegroundColor White
Write-Host ""
Write-Host "  ⚠️  NO CIERRES ESTAS VENTANAS" -ForegroundColor Red
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

Read-Host "Presiona Enter para salir (deja las otras ventanas abiertas)"
