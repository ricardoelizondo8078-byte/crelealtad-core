# Script para convertir campos de camelCase a snake_case en SolicitudFormScreen

$file = "C:\Users\Admin\Desktop\CRELEALTAD CORE\apps\mobile\src\features\solicitudes\SolicitudFormScreen.tsx"

$content = Get-Content $file -Raw -Encoding UTF8

# Campos personales
$content = $content -replace '\bfechaNacimiento\b', 'fecha_nac'
$content = $content -replace '\bestadoCivil\b', 'estado_civil'
$content = $content -replace '\bnivelEstudio\b', 'nivel_estudio'
$content = $content -replace '\bapellidoPaterno\b', 'apellido_pat'
$content = $content -replace '\bapellidoMaterno\b', 'apellido_mat'
$content = $content -replace '\bestadoNacimiento\b', 'estado_nacimiento'
$content = $content -replace '\bsegundoNombre\b', 'segundo_nombre'
$content = $content -replace '\bprimerNombre\b', 'primer_nombre'

# Domicilio
$content = $content -replace '\bdomCalle\b', 'dom_calle'
$content = $content -replace '\bdomNumExt\b', 'dom_num_ext'
$content = $content -replace '\bdomNumInt\b', 'dom_num_int'
$content = $content -replace '\bdomEntreCalles\b', 'dom_entre_calles'
$content = $content -replace '\bdomCpId\b', 'dom_cp_id'
$content = $content -replace '\bdomColonia\b', 'dom_colonia'
$content = $content -replace '\bdomMunicipio\b', 'dom_municipio'
$content = $content -replace '\bdomEstado\b', 'dom_estado'
$content = $content -replace '\bdomTelefono\b', 'dom_telefono'

# Referencias
$content = $content -replace '\bref1Nombre\b', 'ref1_nombre'
$content = $content -replace '\bref1Parentesco\b', 'ref1_parentesco'
$content = $content -replace '\bref1Telefono\b', 'ref1_telefono'
$content = $content -replace '\bref1Direccion\b', 'ref1_direccion'
$content = $content -replace '\bref2Nombre\b', 'ref2_nombre'
$content = $content -replace '\bref2Parentesco\b', 'ref2_parentesco'
$content = $content -replace '\bref2Telefono\b', 'ref2_telefono'
$content = $content -replace '\bref2Direccion\b', 'ref2_direccion'

# Pareja
$content = $content -replace '\bparejaNombre\b', 'pareja_nombre'
$content = $content -replace '\bparejaActividad\b', 'pareja_actividad'
$content = $content -replace '\bparejaIngresoSemanal\b', 'pareja_ingreso_semanal'

# Negocio
$content = $content -replace '\bnegocioDomicilio\b', 'negocio_domicilio'
$content = $content -replace '\bnegocioCpId\b', 'negocio_cp_id'
$content = $content -replace '\bnegocioColonia\b', 'negocio_colonia'
$content = $content -replace '\bnegocioMunicipio\b', 'negocio_municipio'
$content = $content -replace '\bnegocioDesdeClando\b', 'negocio_desde_cuando'
$content = $content -replace '\bnegocioGiro\b', 'negocio_giro'
$content = $content -replace '\bnegocioIngresoSemanal\b', 'negocio_ingreso_semanal'
$content = $content -replace '\bnegocioOtrosIngresos\b', 'negocio_otros_ingresos'
$content = $content -replace '\bnegocioGastos\b', 'negocio_gastos'
$content = $content -replace '\bnegocioTotal\b', 'negocio_total'

# Beneficiario
$content = $content -replace '\bbeneficiarioNombre\b', 'beneficiario_nombre'
$content = $content -replace '\bbeneficiarioParentesco\b', 'beneficiario_parentesco'
$content = $content -replace '\bbeneficiarioTelefono\b', 'beneficiario_telefono'
$content = $content -replace '\bbeneficiarioDireccion\b', 'beneficiario_direccion'

# Validaciones
$content = $content -replace '\btieneMedidorLuz\b', 'tiene_medidor_luz'
$content = $content -replace '\bviveMax5kmTesorera\b', 'vive_max_5km_tesorera'
$content = $content -replace '\btieneMenos70Anios\b', 'tiene_menos_70_anios'

# Variables de estado de React (mantener camelCase para estas)
$content = $content -replace '\bsetFecha_nac', 'setFechaNac'
$content = $content -replace '\bfecha_nacInput', 'fechaNacInput'

Set-Content -Path $file -Value $content -Encoding UTF8 -NoNewline

Write-Host "✅ Campos convertidos a snake_case" -ForegroundColor Green
