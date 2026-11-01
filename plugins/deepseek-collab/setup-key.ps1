$ErrorActionPreference = 'Stop'
$stateDirectory = Join-Path $env:LOCALAPPDATA 'deepseek-collab'
New-Item -ItemType Directory -Force -Path $stateDirectory | Out-Null
$localSecret = Read-Host '请输入百炼 API Key（仅本机输入，不发送到聊天）' -AsSecureString
if ($localSecret.Length -eq 0) { throw '没有输入密钥，未保存。' }
$encryptedSecret = ConvertFrom-SecureString -SecureString $localSecret
[System.IO.File]::WriteAllText((Join-Path $stateDirectory 'key.dpapi'), $encryptedSecret)
$localSecret.Dispose()
Write-Host '已使用当前 Windows 用户的 DPAPI 加密保存。未调用供应商 API。'
