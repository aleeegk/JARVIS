@echo off
title JARVIS v5 — DEMO Stark Mark VII HUD (UI Antigua)
color 0E

echo ============================================================
echo   JARVIS v5 - DEMO OFFLINE DE ESCRITORIO (UI ANTIGUA)
echo   Stark Mark VII 3D Holographic HUD
echo ============================================================
echo   [i] Ollama desconectado para optimizacion de recursos.
echo   [i] Holograma 3D Three.js y telemetria activos.
echo   [i] Modo interactivo para explorar botones y controles.
echo ============================================================
echo.

cd /d "%~dp0demos\ui_antigua"
python demo_app.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Ocurrio un problema al ejecutar la demo.
    pause
)
