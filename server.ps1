param(
  [int]$Port = 8000
)

$bundledPython = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$python = if (Test-Path $bundledPython) { $bundledPython } else { "python" }

Push-Location $PSScriptRoot
try {
  Write-Host "Servidor local rodando em: http://localhost:$Port" -ForegroundColor Green
  Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
  & $python -m http.server $Port
} finally {
  Pop-Location
}
