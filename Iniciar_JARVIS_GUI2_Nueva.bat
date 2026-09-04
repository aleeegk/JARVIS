@echo off
chcp 65001 >nul
title JARVIS // CMD - GUI 2 Neural AI Command Center (Nueva)
color 0B

echo ============================================================
echo   Iniciando JARVIS con GUI 2: Neural AI Command Center (Nueva)
echo ============================================================
echo.

cd /d "%~dp0demos\ui_nueva"
python run_desktop.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se pudo iniciar la nueva interfaz grafica.
    pause
)
