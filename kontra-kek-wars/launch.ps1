$ErrorActionPreference = 'Stop'
$arcadeRoot = Split-Path -Parent $PSScriptRoot
$gameUrl = 'http://127.0.0.1:4188/kontra-kek-wars/index.html'
function Test-GameServer {
  try { return (Invoke-WebRequest -Uri $gameUrl -UseBasicParsing -TimeoutSec 2).Content.Contains('THE KEK WARS') } catch { return $false }
}
if (-not (Test-GameServer)) {
  $nodePath = (Get-Command node -ErrorAction Stop).Source
  $env:PORT = '4188'
  $serverScript = Join-Path $arcadeRoot 'scripts\dev-server.mjs'
  Start-Process -FilePath $nodePath -ArgumentList ('"' + $serverScript + '"') -WorkingDirectory $arcadeRoot -WindowStyle Hidden
  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    if (Test-GameServer) { break }
    Start-Sleep -Milliseconds 200
  }
  if (-not (Test-GameServer)) { throw 'Could not start Kek Wars. Check that Node.js is installed and port 4188 is available.' }
}
Start-Process $gameUrl
