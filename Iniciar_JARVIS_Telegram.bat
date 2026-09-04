@echo off
title JARVIS v5 - Control Remoto Telegram (Servicio de Fondo)
color 0A
echo =========================================================
echo       INICIANDO JARVIS v5 (CONTROL REMOTO TELEGRAM)
echo =========================================================
echo.
echo Controla tu PC desde cualquier lugar con tu bot de Telegram.
echo Presiona Ctrl+C para cerrar el servicio.
echo.
cd /d "%~dp0apps\ollama_v5"
python jarvis_telegram_daemon.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AVISO] Se detuvo el servicio de Telegram.
    pause
)
