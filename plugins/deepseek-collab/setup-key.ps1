param([ValidateSet('bailian','custom')][string]$Provider = 'bailian',[string]$Endpoint)
$ErrorActionPreference = 'Stop'
if ($Provider -eq 'custom') {
  $parsed = $null
  if (-not [Uri]::TryCreate($Endpoint, [UriKind]::Absolute, [ref]$parsed) -or $parsed.Scheme -ne 'https' -or $parsed.UserInfo -or $parsed.Fragment -or $parsed.Query) { throw '请提供不含账户信息和查询参数的 HTTPS 供应商完整地址。' }
}
$stateDirectory = Join-Path $env:LOCALAPPDATA 'deepseek-collab'
New-Item -ItemType Directory -Force -Path $stateDirectory | Out-Null
$localSecret = Read-Host "请输入 $Provider 的 API Key（仅本机输入，不发送到聊天）" -AsSecureString
if ($localSecret.Length -eq 0) { throw '没有输入密钥，未保存。' }
$encryptedSecret = ConvertFrom-SecureString -SecureString $localSecret
$keyFile = if ($Provider -eq 'custom') { 'custom-key.dpapi' } else { 'key.dpapi' }
[System.IO.File]::WriteAllText((Join-Path $stateDirectory $keyFile), $encryptedSecret)
if ($Provider -eq 'custom') { [System.IO.File]::WriteAllText((Join-Path $stateDirectory 'custom-endpoint.txt'), $Endpoint.Trim()) }
$localSecret.Dispose()
Write-Host '已使用当前 Windows 用户的 DPAPI 加密保存。未调用供应商 API。'
