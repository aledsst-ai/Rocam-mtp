@echo off
setlocal

set "PORT=%~1"
if "%PORT%"=="" set "PORT=8000"

set "PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%PYTHON%" set "PYTHON=python"

cd /d "%~dp0"
echo Servidor local rodando em: http://localhost:%PORT%
echo Pressione Ctrl+C para parar
"%PYTHON%" -m http.server %PORT%
