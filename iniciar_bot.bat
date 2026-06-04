@echo off
:loop
python bot_customizado_do_usuario.py
echo Bot desconectou! Reiniciando em 5 segundos...
timeout /t 5
goto loop
pause