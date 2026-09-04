@echo off
title JARVIS v5 - GUI 1 Stark Mark VII HUD (Clasica)
color 0E

echo ============================================================
echo   Iniciando JARVIS con GUI 1: Stark Mark VII HUD (Clasica)
echo ============================================================
echo.

cd /d "%~dp0apps\ollama_v5"
python jarvis_app.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se pudo iniciar la interfaz grafica clasica.
    pause
)
