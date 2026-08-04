# Detectar IP local
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*"} | Select-Object -First 1).IPAddress

Write-Host "IP detectada: $ip" -ForegroundColor Green

# Actualizar .env con la IP correcta
$envPath = Join-Path $PSScriptRoot "apps\mobile\.env"
$envContent = "EXPO_PUBLIC_API_BASE_URL=http://${ip}:3000 "
$envContent | Out-File -FilePath $envPath -Encoding UTF8 -NoNewline
Write-Host "Archivo .env actualizado con IP: $ip" -ForegroundColor Green

# Generar HTML del QR
$html = @"
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>QR CRELEALTAD</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <style>
        body { font-family: Arial; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); text-align: center; }
        h1 { margin: 0 0 10px 0; color: #667eea; }
        .badge { display: inline-block; background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 20px; }
        #qrcode { display: inline-block; padding: 20px; }
        .url { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px; font-family: monospace; font-size: 14px; color: #667eea; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="badge">✓ IP: $ip</div>
        <h1>📱 CRELEALTAD</h1>
        <div id="qrcode"></div>
        <div class="url">exp://$ip:8081</div>
    </div>
    <script>
        new QRCode(document.getElementById("qrcode"), {
            text: "exp://$ip:8081",
            width: 256,
            height: 256,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    </script>
</body>
</html>
"@

# Guardar HTML
$qrPath = Join-Path $PSScriptRoot "QR-AUTO.html"
$html | Out-File -FilePath $qrPath -Encoding UTF8

Write-Host "QR generado en: QR-AUTO.html" -ForegroundColor Green

# Abrir QR en navegador
Start-Process $qrPath
