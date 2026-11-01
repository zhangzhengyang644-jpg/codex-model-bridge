param([Parameter(Mandatory=$true)][string]$CredentialPath)
$ErrorActionPreference = 'Stop'
$localSecret = Get-Content -Raw -LiteralPath $CredentialPath | ConvertTo-SecureString
try { [System.Net.NetworkCredential]::new('', $localSecret).Password }
finally { $localSecret.Dispose() }
