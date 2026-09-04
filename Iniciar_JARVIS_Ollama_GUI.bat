@echo off
title JARVIS v5 - Holographic Desktop App (Ollama)
color 0B
echo =========================================================
echo       INICIANDO JARVIS v5 (APP DE ESCRITORIO OLLAMA)
echo =========================================================
echo.
echo Cargando interfaz grafica y holograma 3D...
cd /d "%~dp0apps\ollama_v5"
python jarvis_app.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Se cerro la aplicacion.
    pause
)
