Write-Host "Servidor local rodando em: http://localhost:8000" -ForegroundColor Green
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
python -m http.server 8000
