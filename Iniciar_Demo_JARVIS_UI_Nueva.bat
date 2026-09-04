@echo off
title JARVIS // CMD — DEMO Neural AI Command Center (UI Nueva)
color 0B

echo ============================================================
echo   JARVIS // CMD - DEMO OFFLINE DE ESCRITORIO (UI NUEVA)
echo   Neural AI Command Center HUD
echo ============================================================
echo   [i] Ollama desconectado para optimizacion de recursos.
echo   [i] 100%% offline, sin dependencias web en ejecucion.
echo   [i] Explora todas las vistas: Telemetria, Terminal, Red,
echo       Automatizaciones, Telegram y Dispositivos.
echo ============================================================
echo.

cd /d "%~dp0demos\ui_nueva"
python run_desktop.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Ocurrio un problema al ejecutar la demo.
    pause
)
