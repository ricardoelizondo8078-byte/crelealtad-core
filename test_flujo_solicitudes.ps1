# test_flujo_solicitudes.ps1
# Flujo completo de 7 pasos del wizard de solicitudes CON AUTENTICACION

$API_URL = "http://localhost:3000"
$ErrorActionPreference = "Stop"

Write-Host "=== FLUJO SOLICITUDES - 7 PASOS ===" -ForegroundColor Green
Write-Host ""

# 0. Autenticación
Write-Host "0. Autenticando usuario admin..." -ForegroundColor Cyan
$login_body = @{
    email = "admin@crelealtad.com"
    password = "1234"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "$API_URL/auth/login" -Method Post -Body $login_body -ContentType "application/json"
$TOKEN = $login.token
Write-Host "Token obtenido: $($TOKEN.Substring(0, 30))..."
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

# 1. Crear grupo
Write-Host "1. Creando grupo..." -ForegroundColor Cyan
$grupo_body = @{
    nombre = "Grupo Wizard Test"
} | ConvertTo-Json
$grupo = Invoke-RestMethod -Uri "$API_URL/grupos" -Method Post -Body $grupo_body -Headers $headers
$GRUPO_ID = $grupo.id
Write-Host "Grupo creado: $GRUPO_ID"
$grupo | ConvertTo-Json -Depth 5
Write-Host ""

# 2. Crear expediente
Write-Host "2. Creando expediente..." -ForegroundColor Cyan
$exp_body = @{
    grupo_id = $GRUPO_ID
} | ConvertTo-Json
$expediente = Invoke-RestMethod -Uri "$API_URL/expedientes" -Method Post -Body $exp_body -Headers $headers
$EXPEDIENTE_ID = $expediente.id
Write-Host "Expediente creado: $EXPEDIENTE_ID"
$expediente | ConvertTo-Json -Depth 5
Write-Host ""

# 3. Crear integrante (incluye persona inline)
Write-Host "3. Creando integrante con persona..." -ForegroundColor Cyan
$integrante_body = @{
    expediente_id = $EXPEDIENTE_ID
    nombres = "MARIA"
    apellidoPaterno = "GONZALEZ"
    apellidoMaterno = "LOPEZ"
    telefono = "5512345678"
    montoSolicitado = 5000
} | ConvertTo-Json
$integrante = Invoke-RestMethod -Uri "$API_URL/integrantes" -Method Post -Body $integrante_body -Headers $headers
$INTEGRANTE_ID = $integrante.id
Write-Host "Integrante creado: $INTEGRANTE_ID"
$integrante | ConvertTo-Json -Depth 5
Write-Host ""

# 4. PATCH Paso 1: datos personales
Write-Host "4. PATCH Paso 1 - Datos personales..." -ForegroundColor Cyan
$paso1_body = @{
    curp = "GOLO901201MDFNPR08"
    fecha_nac = "1990-12-01"
    genero = "FEMENINO"
} | ConvertTo-Json
$paso1 = Invoke-RestMethod -Uri "$API_URL/solicitudes/$INTEGRANTE_ID" -Method Patch -Body $paso1_body -Headers $headers
$paso1 | ConvertTo-Json -Depth 5
Write-Host ""

# 5. PATCH Paso 2: domicilio
Write-Host "5. PATCH Paso 2 - Domicilio..." -ForegroundColor Cyan
$paso2_body = @{
    dom_calle = "Av. Juárez 123"
    dom_colonia = "Centro"
    dom_municipio = "Monterrey"
} | ConvertTo-Json
$paso2 = Invoke-RestMethod -Uri "$API_URL/solicitudes/$INTEGRANTE_ID" -Method Patch -Body $paso2_body -Headers $headers
$paso2 | ConvertTo-Json -Depth 5
Write-Host ""

# 6. PATCH Paso 3: referencias
Write-Host "6. PATCH Paso 3 - Referencias..." -ForegroundColor Cyan
$paso3_body = @{
    ref1_nombre = "Juan Perez Garcia"
    ref2_nombre = "Ana Martinez Lopez"
} | ConvertTo-Json
$paso3 = Invoke-RestMethod -Uri "$API_URL/solicitudes/$INTEGRANTE_ID" -Method Patch -Body $paso3_body -Headers $headers
$paso3 | ConvertTo-Json -Depth 5
Write-Host ""

# 7. PATCH Paso 4: negocio
Write-Host "7. PATCH Paso 4 - Negocio..." -ForegroundColor Cyan
$paso4_body = @{
    negocio_giro = "COMERCIO"
    negocio_ingreso_semanal = 2500
} | ConvertTo-Json
$paso4 = Invoke-RestMethod -Uri "$API_URL/solicitudes/$INTEGRANTE_ID" -Method Patch -Body $paso4_body -Headers $headers
$paso4 | ConvertTo-Json -Depth 5
Write-Host ""

# 8. PATCH Paso 5: beneficiario
Write-Host "8. PATCH Paso 5 - Beneficiario..." -ForegroundColor Cyan
$paso5_body = @{
    beneficiario_nombre = "Pedro Gonzalez Ramirez"
    beneficiario_parentesco = "HIJO"
} | ConvertTo-Json
$paso5 = Invoke-RestMethod -Uri "$API_URL/solicitudes/$INTEGRANTE_ID" -Method Patch -Body $paso5_body -Headers $headers
$paso5 | ConvertTo-Json -Depth 5
Write-Host ""

# 9. PATCH Paso 6: validaciones
Write-Host "9. PATCH Paso 6 - Validaciones..." -ForegroundColor Cyan
$paso6_body = @{
    tiene_medidor_luz = $true
    vive_max_5km_tesorera = $true
} | ConvertTo-Json
$paso6 = Invoke-RestMethod -Uri "$API_URL/solicitudes/$INTEGRANTE_ID" -Method Patch -Body $paso6_body -Headers $headers
$paso6 | ConvertTo-Json -Depth 5
Write-Host ""

# 10. PATCH Paso 7: documentos
Write-Host "10. PATCH Paso 7 - Documentos..." -ForegroundColor Cyan
$paso7_body = @{
    doc_ine_ruta = "/uploads/ine_test.jpg"
    doc_comprobante_ruta = "/uploads/comp_test.pdf"
    doc_ine_beneficiario_ruta = "/uploads/ine_ben_test.jpg"
    doc_solicitud_firmada_ruta = "/uploads/sol_test.pdf"
} | ConvertTo-Json
$paso7 = Invoke-RestMethod -Uri "$API_URL/solicitudes/$INTEGRANTE_ID" -Method Patch -Body $paso7_body -Headers $headers
$paso7 | ConvertTo-Json -Depth 5
Write-Host ""

# 11. GET final
Write-Host "11. GET solicitud completa..." -ForegroundColor Cyan
$final = Invoke-RestMethod -Uri "$API_URL/solicitudes/integrante/$INTEGRANTE_ID" -Method Get -Headers $headers
$final | ConvertTo-Json -Depth 10
Write-Host ""

Write-Host "=== FLUJO COMPLETADO ===" -ForegroundColor Green
Write-Host "Integrante ID: $INTEGRANTE_ID" -ForegroundColor Yellow
