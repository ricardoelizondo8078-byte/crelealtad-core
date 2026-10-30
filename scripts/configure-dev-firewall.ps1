[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'

$principal = New-Object Security.Principal.WindowsPrincipal(
  [Security.Principal.WindowsIdentity]::GetCurrent()
)

if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Este script debe ejecutarse como administrador.'
}

$nodePath = (Get-Command node -ErrorAction Stop).Source
$tailscalePath = Join-Path $env:ProgramFiles 'Tailscale\tailscaled.exe'
$tailscaleRemoteAddress = '100.64.0.0/10'
$lanRemoteAddress = 'LocalSubnet'

if (-not (Test-Path -LiteralPath $tailscalePath)) {
  throw "No se encontró tailscaled.exe en $tailscalePath."
}

$rules = @(
  @{
    Name = 'CRELEALTAD CORE API 3100'
    Description = 'API NestJS para pruebas desde dispositivos de la red local.'
    Port = 3100
    Program = $nodePath
    RemoteAddress = @($lanRemoteAddress, $tailscaleRemoteAddress)
  },
  @{
    Name = 'CRELEALTAD CORE Expo 8082'
    Description = 'Metro/Expo para pruebas remotas desde dispositivos conectados por Tailscale.'
    Port = 8082
    Program = $nodePath
    RemoteAddress = @($lanRemoteAddress, $tailscaleRemoteAddress)
  },
  @{
    Name = 'CRELEALTAD CORE Tailscale API 3100'
    Description = 'Proxy privado de Tailscale hacia la API de desarrollo.'
    Port = 3100
    Program = $tailscalePath
    RemoteAddress = @($tailscaleRemoteAddress)
  },
  @{
    Name = 'CRELEALTAD CORE Tailscale Expo 8081'
    Description = 'Compatibilidad del proxy privado de Tailscale hacia Metro/Expo.'
    Port = 8081
    Program = $tailscalePath
    RemoteAddress = @($tailscaleRemoteAddress)
  },
  @{
    Name = 'CRELEALTAD CORE Tailscale Expo 8082'
    Description = 'Proxy privado de Tailscale hacia Metro/Expo.'
    Port = 8082
    Program = $tailscalePath
    RemoteAddress = @($tailscaleRemoteAddress)
  }
)

foreach ($ruleDefinition in $rules) {
  $existingRule = Get-NetFirewallRule `
    -DisplayName $ruleDefinition.Name `
    -ErrorAction SilentlyContinue

  if ($existingRule) {
    $existingRule | Set-NetFirewallRule `
      -Enabled True `
      -Direction Inbound `
      -Action Allow `
      -Profile Private, Public
    $existingRule | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter `
      -Protocol TCP `
      -LocalPort $ruleDefinition.Port
    $existingRule | Get-NetFirewallAddressFilter | Set-NetFirewallAddressFilter `
      -RemoteAddress $ruleDefinition.RemoteAddress
    $existingRule | Get-NetFirewallApplicationFilter | Set-NetFirewallApplicationFilter `
      -Program $ruleDefinition.Program
    continue
  }

  New-NetFirewallRule `
    -DisplayName $ruleDefinition.Name `
    -Description $ruleDefinition.Description `
    -Direction Inbound `
    -Action Allow `
    -Enabled True `
    -Profile Private, Public `
    -Program $ruleDefinition.Program `
    -Protocol TCP `
    -LocalPort $ruleDefinition.Port `
    -RemoteAddress $ruleDefinition.RemoteAddress | Out-Null
}

Get-NetFirewallRule -DisplayName 'CRELEALTAD CORE*' |
  Select-Object DisplayName, Enabled, Direction, Action, Profile |
  Format-Table -AutoSize

Write-Host 'Firewall configurado. Ya puedes probar el health desde el iPhone.'
