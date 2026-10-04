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
$rules = @(
  @{
    Name = 'CRELEALTAD CORE API 3100'
    Description = 'API NestJS para pruebas desde dispositivos de la red local.'
    Port = 3100
  },
  @{
    Name = 'CRELEALTAD CORE Expo 8081'
    Description = 'Metro/Expo para pruebas desde dispositivos de la red local.'
    Port = 8081
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
    continue
  }

  New-NetFirewallRule `
    -DisplayName $ruleDefinition.Name `
    -Description $ruleDefinition.Description `
    -Direction Inbound `
    -Action Allow `
    -Enabled True `
    -Profile Private, Public `
    -Program $nodePath `
    -Protocol TCP `
    -LocalPort $ruleDefinition.Port `
    -RemoteAddress LocalSubnet | Out-Null
}

Get-NetFirewallRule -DisplayName 'CRELEALTAD CORE*' |
  Select-Object DisplayName, Enabled, Direction, Action, Profile |
  Format-Table -AutoSize

Write-Host 'Firewall configurado. Ya puedes probar el health desde el iPhone.'
