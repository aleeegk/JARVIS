@echo off
title JARVIS - Iniciar GUI Activa
color 0E
python "%~dp0cambiar_gui.py" --launch
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se pudo iniciar la interfaz grafica activa.
    pause
)
