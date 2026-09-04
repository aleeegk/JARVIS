@echo off
title JARVIS v5 - Consola Autonoma (Ollama)
color 0A
echo =========================================================
echo       INICIANDO JARVIS v5 (MODO CONSOLA OLLAMA)
echo =========================================================
echo.
cd /d "%~dp0apps\ollama_v5"
python jarvis_v5.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Se detuvo el proceso.
    pause
)
